from django.db import models
from django.conf import settings


class MarketOffer(models.Model):
    STATUS_CHOICES = (
        ('open', 'Ouvert'),
        ('close', 'fermé'),
    )

    title = models.CharField('titre', max_length=200, blank=True)
    description = models.TextField('description', blank=True)
    price_offered = models.DecimalField('prix offert', max_digits=20, decimal_places=2)
    status = models.CharField('statut', max_length=32, choices=STATUS_CHOICES, default='open')
    expires_at = models.DateTimeField('expire à', null=True, blank=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'offre de marché'
        verbose_name_plural = 'offres de marché'

    def __str__(self):
        return f"Offer {self.pk}: {self.title} -> {self.price_offered} ({self.status})"


class Wallet(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='wallets')
    currency = models.CharField('devise', max_length=10, default='USDT')
    available = models.DecimalField('disponible', max_digits=20, decimal_places=2, default=0)
    pending = models.DecimalField('en attente', max_digits=20, decimal_places=2, default=0)
    gains = models.DecimalField('gains', max_digits=20, decimal_places=2, default=0)
    sale_balance = models.DecimalField('solde de vente', max_digits=20, decimal_places=2, default=0)
    invested = models.DecimalField('solde investi', max_digits=20, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'portefeuille'
        verbose_name_plural = 'portefeuilles'

    def __str__(self):
        return f"Portefeuille {self.id} ({self.user}) - {self.currency}"


class Investor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investor')
    phone = models.CharField('téléphone', max_length=32, blank=True, null=True)
    total_invested = models.DecimalField('total investi', max_digits=20, decimal_places=2, default=0)
    portfolio_value = models.DecimalField('valeur du portefeuille', max_digits=20, decimal_places=2, default=0)
    vip_level = models.IntegerField('niveau VIP', default=0)
    vip_since = models.DateTimeField('VIP depuis', null=True, blank=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'investisseur'
        verbose_name_plural = 'investisseurs'

    def __str__(self):
        return f"Investisseur {self.user.username}"


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Dépôt'),
        ('withdraw', 'Retrait'),
        ('trade', 'Échange'),
        ('referral', 'Parrainage'),
        ('transfer', 'Transfert'),
        ('interest', 'Intérêt'),
        ('encash', 'Encaissement'),
    )

    wallet = models.ForeignKey(Wallet, verbose_name='portefeuille', on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField('montant', max_digits=20, decimal_places=2)
    type = models.CharField('type de transaction', max_length=20, choices=TRANSACTION_TYPES)
    created_at = models.DateTimeField('date', auto_now_add=True)

    class Meta:
        verbose_name = 'transaction'
        verbose_name_plural = 'transactions'

    def __str__(self):
        return f"{self.get_type_display()} {self.amount} -> {self.wallet}"


class Deposit(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('awaiting_payment', 'En attente de paiement'),
        ('completed', 'Terminé'),
        ('failed', 'Échoué'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField('montant', max_digits=20, decimal_places=2)
    currency = models.CharField('devise', max_length=10, default='XAF')
    status = models.CharField('statut', max_length=32, choices=STATUS_CHOICES, default='pending')
    external_id = models.CharField('id externe', max_length=128, blank=True, null=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'dépôt'
        verbose_name_plural = 'dépôts'

    def __str__(self):
        return f"Dépôt {self.id} ({self.amount} {self.currency}) - {self.status}"


class Trade(models.Model):
    """Record of a market trade (acceptance of a virtual offer or matched order)."""
    offer_id = models.CharField('offer id', max_length=128)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='vendeur', on_delete=models.CASCADE, related_name='trades')
    amount = models.DecimalField('montant demandé', max_digits=20, decimal_places=2)
    price = models.DecimalField('prix offert', max_digits=20, decimal_places=2)
    surplus = models.DecimalField('surplus', max_digits=20, decimal_places=2)
    buyer_info = models.JSONField('acheteur', blank=True, null=True)
    created_at = models.DateTimeField('date', auto_now_add=True)

    class Meta:
        verbose_name = 'trade'
        verbose_name_plural = 'trades'

    def __str__(self):
        return f"Trade {self.id}: {self.seller} sold {self.amount} -> {self.price} (surplus {self.surplus})"


class ReferralCode(models.Model):
    """A referral code owned by a referrer user."""
    code = models.CharField('code', max_length=64, unique=True)
    referrer = models.OneToOneField(settings.AUTH_USER_MODEL, verbose_name='parrain', on_delete=models.CASCADE, related_name='referral_code')
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'code de parrainage'
        verbose_name_plural = 'codes de parrainage'

    def __str__(self):
        return f"{self.code} -> {self.referrer}"


class Referral(models.Model):
    STATUS = (
        ('pending', 'Pending'),
        ('used', 'Used'),
        ('cancelled', 'Cancelled'),
    )

    code = models.ForeignKey(ReferralCode, verbose_name='code', on_delete=models.CASCADE, related_name='referrals')
    referred_user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='filleul', on_delete=models.CASCADE, related_name='referred_by', null=True, blank=True)
    created_at = models.DateTimeField('date', auto_now_add=True)
    used_at = models.DateTimeField('utilisé le', null=True, blank=True)
    status = models.CharField('statut', max_length=32, choices=STATUS, default='pending')
    meta = models.JSONField('meta', null=True, blank=True)

    class Meta:
        verbose_name = 'parrainage'
        verbose_name_plural = 'parrainages'

    def __str__(self):
        return f"Referral {self.id} code={self.code.code} -> {self.referred_user} ({self.status})"


class ReferralReward(models.Model):
    """Record of a reward paid to the referrer when a referral meets conditions."""
    referral = models.ForeignKey(Referral, verbose_name='parrainage', on_delete=models.CASCADE, related_name='rewards')
    amount = models.DecimalField('montant', max_digits=20, decimal_places=2)
    transaction = models.ForeignKey(Transaction, verbose_name='transaction', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField('date', auto_now_add=True)

    class Meta:
        verbose_name = 'récompense de parrainage'
        verbose_name_plural = 'récompenses de parrainage'

    def __str__(self):
        return f"Reward {self.id} {self.amount} for referral {self.referral_id}"


class Investment(models.Model):
    """Represents a user's locked investment which accrues daily interest.

    The backend will not automatically move funds back to `available` unless
    an accrual or a withdrawal action is performed. Daily rate is stored as
    a decimal (e.g. 0.025 for 2.5% daily) to allow flexibility.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='investments')
    wallet = models.ForeignKey(Wallet, verbose_name='portefeuille', on_delete=models.CASCADE, related_name='investments')
    amount = models.DecimalField('montant investi', max_digits=20, decimal_places=2)
    daily_rate = models.DecimalField('taux journalier', max_digits=10, decimal_places=6, default=0.025)
    last_accrual = models.DateTimeField('dernière capitalisation', null=True, blank=True)
    # accrued interest not yet encashed for this investment
    accrued = models.DecimalField('intérêts accumulés', max_digits=20, decimal_places=2, default=0)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    active = models.BooleanField('actif', default=True)

    class Meta:
        verbose_name = 'investissement'
        verbose_name_plural = 'investissements'

    def __str__(self):
        return f"Investment {self.id} {self.user} {self.amount} @ {self.daily_rate}"


class HiddenOffer(models.Model):
    """Mark a MarketOffer as hidden for a specific user until a given datetime.

    If `user` is null, the hidden marker is global (applies to all users).
    """
    offer = models.ForeignKey(MarketOffer, verbose_name='offre', on_delete=models.CASCADE, related_name='hidden_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, null=True, blank=True, related_name='hidden_offers')
    hidden_until = models.DateTimeField('masqué jusqu\'à')
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'offre masquée'
        verbose_name_plural = 'offres masquées'

    def __str__(self):
        return f"HiddenOffer offer={self.offer_id} user={self.user_id} until={self.hidden_until}"


class VIPLevel(models.Model):
    """VIP subscription levels (1 to 12) defined by admin."""
    LEVEL_CHOICES = tuple((i, f"Niveau {i}") for i in range(1, 13))
    
    level = models.IntegerField('niveau', choices=LEVEL_CHOICES, unique=True)
    title = models.CharField('titre', max_length=100, blank=True)
    price = models.DecimalField('prix', max_digits=20, decimal_places=2)
    percentage = models.DecimalField('pourcentage', max_digits=5, decimal_places=2, default=0)
    daily_gains = models.DecimalField('gains quotidiens', max_digits=20, decimal_places=2, default=0)
    delay_days = models.IntegerField('délai en jours', default=0)
    description = models.TextField('description', blank=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'niveau VIP'
        verbose_name_plural = 'niveaux VIP'
        ordering = ['level']

    def __str__(self):
        return f"VIP Niveau {self.level} - {self.price}"


class UserVIPSubscription(models.Model):
    """Track which VIP levels a user has purchased."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='vip_subscriptions')
    vip_level = models.ForeignKey(VIPLevel, verbose_name='niveau VIP', on_delete=models.CASCADE)
    purchased_at = models.DateTimeField('acheté le', auto_now_add=True)
    active = models.BooleanField('actif', default=True)

    class Meta:
        verbose_name = 'souscription VIP'
        verbose_name_plural = 'souscriptions VIP'
        unique_together = ('user', 'vip_level')

    def __str__(self):
        return f"{self.user} - Niveau {self.vip_level.level}"

class Operateur(models.Model):
    OPERATOR_CHOICES = (
        ('orange', 'Orange'),
        ('airtel', 'Airtel'),
        ('mpesa', 'M-Pesa'),
    )

    numero_agent = models.CharField('numéro de l\'agent', max_length=20, unique=True)
    nom_agent = models.CharField('nom de l\'agent', max_length=100)
    operateur = models.CharField('opérateur', max_length=20, choices=OPERATOR_CHOICES)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('date de mise à jour', auto_now=True)

    class Meta:
        verbose_name = 'opérateur'
        verbose_name_plural = 'opérateurs'
        unique_together = ('numero_agent', 'operateur')

    def __str__(self):
        return f"{self.get_operateur_display()} - {self.nom_agent} ({self.numero_agent})"


class UserBankAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = (
        ('bank', 'Banque'),
        ('operator', 'Opérateur'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='bank_accounts')
    account_type = models.CharField('type de compte', max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    
    # Pour les banques
    bank_name = models.CharField('nom de la banque', max_length=100, blank=True, null=True)
    
    # Pour les opérateurs (Orange, Airtel, M-Pesa)
    operator_name = models.CharField('nom de l\'opérateur', max_length=50, blank=True, null=True)
    
    # Informations communes
    account_number = models.CharField('numéro de compte', max_length=100)
    account_holder_name = models.CharField('nom du titulaire', max_length=200)
    
    is_active = models.BooleanField('actif', default=True)
    is_default = models.BooleanField('compte par défaut', default=False)
    
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('date de mise à jour', auto_now=True)

    class Meta:
        verbose_name = 'compte bancaire utilisateur'
        verbose_name_plural = 'comptes bancaires utilisateurs'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        if self.account_type == 'bank':
            return f"{self.bank_name} - {self.account_holder_name} ({self.account_number})"
        else:
            return f"{self.operator_name} - {self.account_holder_name} ({self.account_number})"

    def save(self, *args, **kwargs):
        # Si ce compte est défini comme par défaut, désactiver les autres comptes par défaut de l'utilisateur
        if self.is_default:
            UserBankAccount.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Withdrawal(models.Model):
    """Demandes de retrait des utilisateurs à traiter par l'administrateur."""
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('processing', 'En cours de traitement'),
        ('completed', 'Complétée'),
        ('rejected', 'Rejetée'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField('montant', max_digits=20, decimal_places=2)
    bank = models.CharField('banque/opérateur', max_length=100)
    account = models.CharField('numéro de compte', max_length=100)
    status = models.CharField('statut', max_length=32, choices=STATUS_CHOICES, default='pending')
    reason_rejected = models.TextField('raison du rejet', blank=True, null=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='traité par', on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_withdrawals')
    processed_at = models.DateTimeField('date de traitement', null=True, blank=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('date de mise à jour', auto_now=True)

    class Meta:
        verbose_name = 'demande de retrait'
        verbose_name_plural = 'demandes de retrait'
        ordering = ['-created_at']

    def __str__(self):
        return f"Retrait {self.id} - {self.user} - {self.amount} ({self.status})"


class AdminNotification(models.Model):
    """Notifications administrateur pour les dépôts et retraits."""
    NOTIFICATION_TYPES = (
        ('deposit', 'Dépôt'),
        ('withdrawal', 'Retrait'),
    )

    admin = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='administrateur', on_delete=models.CASCADE, related_name='admin_notifications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='utilisateur', on_delete=models.CASCADE, related_name='user_notifications')
    notification_type = models.CharField('type de notification', max_length=20, choices=NOTIFICATION_TYPES)
    amount = models.DecimalField('montant', max_digits=20, decimal_places=2)
    account_info = models.CharField('info compte', max_length=255)
    is_read = models.BooleanField('lu', default=False)
    deposit = models.ForeignKey(Deposit, verbose_name='dépôt', on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_notifications')
    withdrawal = models.ForeignKey(Withdrawal, verbose_name='retrait', on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_notifications')
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'notification administrateur'
        verbose_name_plural = 'notifications administrateur'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification {self.id} - {self.get_notification_type_display()} - {self.user}"


class CryptoAddress(models.Model):
    """Modèle pour gérer les adresses crypto depuis l'admin."""
    NETWORK_CHOICES = (
        ('TRC20_USDT', 'TRC-20 (USDT)'),
        ('BEP20_USDT', 'BEP-20 (USDT)'),
        ('BNB', 'BNB (Binance Smart Chain)'),
    )
    
    network = models.CharField('réseau', max_length=20, choices=NETWORK_CHOICES, unique=True)
    address = models.CharField('adresse', max_length=255)
    is_active = models.BooleanField('actif', default=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('date de modification', auto_now=True)
    
    class Meta:
        verbose_name = 'adresse crypto'
        verbose_name_plural = 'adresses crypto'
        ordering = ['network']
    
    def __str__(self):
        return f"{self.get_network_display()} - {self.address[:20]}..."


class SocialLinks(models.Model):
    """Modèle pour gérer les liens réseaux sociaux depuis l'admin."""
    whatsapp_channel = models.URLField('Lien Canal WhatsApp', max_length=500, blank=True, null=True)
    whatsapp_group = models.URLField('Lien Groupe WhatsApp', max_length=500, blank=True, null=True)
    telegram_channel = models.URLField('Lien Canal Telegram', max_length=500, blank=True, null=True)
    telegram_group = models.URLField('Lien Groupe Telegram', max_length=500, blank=True, null=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('date de modification', auto_now=True)
    
    class Meta:
        verbose_name = 'Lien Réseau Social'
        verbose_name_plural = 'Liens Réseaux Sociaux'
    
    def __str__(self):
        return f"Liens Réseaux Sociaux (ID: {self.id})"
    
    def save(self, *args, **kwargs):
        # Garantir qu'il n'y a qu'une seule instance
        if not self.pk and SocialLinks.objects.exists():
            # Si c'est une nouvelle instance et qu'il en existe déjà une, mettre à jour l'existante
            existing = SocialLinks.objects.first()
            self.pk = existing.pk
        super().save(*args, **kwargs)