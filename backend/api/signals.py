from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

from .models import Deposit, Referral, ReferralReward, Wallet, Transaction, Withdrawal, AdminNotification, UserNotification
from .utils import recompute_vip_for_user
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=Deposit)
def handle_deposit_completed(sender, instance: Deposit, created, **kwargs):
    """Gestion des commissions de parrainage multi-générations (3 générations).
    
    Génération 1 (Parent) -> Génération 2 (Enfant): 10% du premier dépôt
    Génération 1 (Parent) -> Génération 3 (Petit-enfant): 3% du premier dépôt
    Génération 1 (Parent) -> Génération 4 (Arrière-petit-enfant): 1% du premier dépôt
    """
    try:
        status = getattr(instance, 'status', None)
        if status != 'completed':
            return

        # Créditer le solde principal du portefeuille de l'utilisateur
        wallet, _ = Wallet.objects.get_or_create(user=instance.user, currency=instance.currency)
        # Pour éviter de créditer plusieurs fois, on peut stocker l'id du dernier dépôt traité dans le wallet (optionnel)
        # Ici, on crédite si le montant du dépôt n'est pas déjà dans le wallet (tolérance simple)
        if not hasattr(instance, '_wallet_credited'):
            wallet.available = (wallet.available + instance.amount).quantize(Decimal('0.01'))
            wallet.save()
            Transaction.objects.create(wallet=wallet, amount=instance.amount, type='deposit')
            instance._wallet_credited = True

        # Montant minimum requis pour valider le dépôt pour le parrainage
        MIN = Decimal(getattr(settings, 'REFERRAL_MIN_DEPOSIT', '1000'))
        if instance.amount < MIN:
            return

        # Parrainage multi-générations
        direct_referral = Referral.objects.filter(
            referred_user=instance.user,
            status='used'
        ).order_by('created_at').first()
        if not direct_referral:
            return
        if direct_referral.first_deposit_reward_processed:
            return
        direct_referral.first_deposit_reward_processed = True
        direct_referral.save()
        with transaction.atomic():
            # Commission pour le parrain direct (10%)
            direct_referrer = direct_referral.code.referrer
            direct_commission = (instance.amount * Decimal('0.10')).quantize(Decimal('0.01'))
            _process_referral_reward(
                user=direct_referrer,
                amount=direct_commission,
                referral=direct_referral,
                deposit=instance,
                reward_type='direct_generation1'
            )
            # Si le parrain direct a lui-même un parrain (grand-parent)
            parent_referral = direct_referral.parent_referral
            if parent_referral:
                # Commission pour le grand-parent (3%)
                grandparent_commission = (instance.amount * Decimal('0.03')).quantize(Decimal('0.01'))
                _process_referral_reward(
                    user=parent_referral.code.referrer,
                    amount=grandparent_commission,
                    referral=parent_referral,
                    deposit=instance,
                    reward_type='indirect_generation2'
                )
                # Si le grand-parent a lui-même un parrain (arrière-grand-parent)
                great_grandparent_referral = parent_referral.parent_referral
                if great_grandparent_referral:
                    great_grandparent_commission = (instance.amount * Decimal('0.01')).quantize(Decimal('0.01'))
                    _process_referral_reward(
                        user=great_grandparent_referral.code.referrer,
                        amount=great_grandparent_commission,
                        referral=great_grandparent_referral,
                        deposit=instance,
                        reward_type='indirect_generation3'
                    )
            # Recompute VIP après le traitement des récompenses
            try:
                recompute_vip_for_user(instance.user)
            except Exception:
                pass
    except Exception as e:
        print(f"Erreur dans handle_deposit_completed: {e}")
        return


def _process_referral_reward(user, amount, referral, deposit, reward_type):
    """Fonction helper pour traiter les récompenses de parrainage."""
    try:
        # Obtenir ou créer le portefeuille de l'utilisateur
        wallet = Wallet.objects.select_for_update().filter(
            user=user,
            currency=deposit.currency
        ).first()
        
        if not wallet:
            wallet = Wallet.objects.create(
                user=user,
                currency=deposit.currency,
                available=Decimal('0'),
                pending=Decimal('0'),
                gains=Decimal('0')
            )
        
        # Ajouter la commission au portefeuille
        wallet.available = (wallet.available + amount).quantize(Decimal('0.01'))
        wallet.gains = (wallet.gains + amount).quantize(Decimal('0.01'))
        wallet.save()
        
        # Créer une transaction de parrainage
        tx = Transaction.objects.create(
            wallet=wallet,
            amount=amount,
            type='referral'
        )
        
        # Enregistrer la récompense
        ReferralReward.objects.create(
            referral=referral,
            amount=amount,
            reward_type=reward_type,
            transaction=tx,
            deposit=deposit
        )
        
    except Exception as e:
        print(f"Erreur dans _process_referral_reward: {e}")
        raise


@receiver(post_save, sender=Withdrawal)
def handle_withdrawal_notification(sender, instance: Withdrawal, created, **kwargs):
    """Créer une notification admin lors d'une nouvelle demande de retrait et notifier l'utilisateur lors d'un changement de statut."""
    try:
        if created:
            # Nouvelle demande de retrait - notifier tous les admins
            admin_users = User.objects.filter(is_staff=True, is_active=True)
            for admin in admin_users:
                AdminNotification.objects.create(
                    admin=admin,
                    user=instance.user,
                    notification_type='withdrawal',
                    amount=instance.amount,
                    account_info=f"{instance.bank} - {instance.account}",
                    withdrawal=instance
                )
        else:
            # Changement de statut - notifier l'utilisateur
            # Récupérer l'ancien statut depuis la base de données
            try:
                from django.db.models import signals
                # Désactiver temporairement le signal pour éviter la récursion
                old_instance = Withdrawal._base_manager.get(pk=instance.pk)
                
                if old_instance.status != instance.status and instance.status in ['completed', 'rejected']:
                    # Débiter le solde principal et créer la transaction si completed
                    if instance.status == 'completed':
                        # Débiter le solde des gains (wallet.gains)
                        try:
                            # Trouver le wallet correspondant à la devise du retrait (par défaut USDT, sinon le premier wallet)
                            wallet = None
                            # Si le retrait a une devise, la retrouver (par défaut USDT)
                            currency = getattr(instance, 'currency', None)
                            if not currency:
                                # Si le modèle Withdrawal n'a pas de champ currency, prendre le wallet principal (USDT)
                                wallet = Wallet.objects.filter(user=instance.user, currency='USDT').first()
                                if not wallet:
                                    wallet = Wallet.objects.filter(user=instance.user).first()
                            else:
                                wallet = Wallet.objects.filter(user=instance.user, currency=currency).first()
                                if not wallet:
                                    wallet = Wallet.objects.filter(user=instance.user).first()
                            if not wallet:
                                print(f"[Retrait] Aucun wallet trouvé pour l'utilisateur {instance.user}")
                            else:
                                if wallet.gains >= instance.amount:
                                    wallet.gains = (wallet.gains - instance.amount).quantize(Decimal('0.01'))
                                    wallet.save()
                                    Transaction.objects.create(wallet=wallet, amount=instance.amount, type='withdraw')
                                    print(f"[Retrait] {instance.amount} retiré des gains de {instance.user} (wallet {wallet.id}, devise {wallet.currency})")
                                else:
                                    print(f"[Retrait] Gains insuffisants pour l'utilisateur {instance.user} (wallet {wallet.id}, devise {wallet.currency})")
                        except Exception as e:
                            print(f"Erreur lors du débit des gains pour le retrait: {e}")
                        # Notification utilisateur
                        UserNotification.objects.create(
                            user=instance.user,
                            notification_type='withdrawal_approved',
                            title='Retrait Approuvé ✅',
                            message=f'Votre demande de retrait de {instance.amount} USDT a été approuvée et traitée avec succès.',
                            withdrawal=instance
                        )
                    elif instance.status == 'rejected':
                        reason = instance.reason_rejected or 'Veuillez contacter l\'administrateur pour plus d\'informations.'
                        UserNotification.objects.create(
                            user=instance.user,
                            notification_type='withdrawal_rejected',
                            title='Retrait Rejeté ❌',
                            message=f'Votre demande de retrait de {instance.amount} USDT a été rejetée. Raison: {reason}',
                            withdrawal=instance
                        )
            except Withdrawal.DoesNotExist:
                pass
    except Exception as e:
        print(f"Erreur dans handle_withdrawal_notification: {e}")
        return


@receiver(post_save, sender=Deposit)
def handle_deposit_notification(sender, instance: Deposit, created, **kwargs):
    """Créer une notification admin lors d'un nouveau dépôt et notifier l'utilisateur lors d'un changement de statut."""
    try:
        if created:
            # Nouveau dépôt - notifier tous les admins
            admin_users = User.objects.filter(is_staff=True, is_active=True)
            for admin in admin_users:
                AdminNotification.objects.create(
                    admin=admin,
                    user=instance.user,
                    notification_type='deposit',
                    amount=instance.amount,
                    account_info=f"{instance.currency} - ID: {instance.id}",
                    deposit=instance
                )
        else:
            # Changement de statut - notifier l'utilisateur
            try:
                old_instance = Deposit._base_manager.get(pk=instance.pk)
                
                if old_instance.status != instance.status and instance.status in ['completed', 'failed']:
                    # Créer une notification pour l'utilisateur
                    if instance.status == 'completed':
                        UserNotification.objects.create(
                            user=instance.user,
                            notification_type='deposit_approved',
                            title='Dépôt Approuvé ✅',
                            message=f'Votre dépôt de {instance.amount} {instance.currency} a été approuvé et ajouté à votre portefeuille.',
                            deposit=instance
                        )
                    elif instance.status == 'failed':
                        UserNotification.objects.create(
                            user=instance.user,
                            notification_type='deposit_rejected',
                            title='Dépôt Rejeté ❌',
                            message=f'Votre dépôt de {instance.amount} {instance.currency} a été rejeté. Veuillez contacter l\'administrateur.',
                            deposit=instance
                        )
            except Deposit.DoesNotExist:
                pass
    except Exception as e:
        print(f"Erreur dans handle_deposit_notification: {e}")
        return
