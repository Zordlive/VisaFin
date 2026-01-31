"""
Module pour gérer les données du tableau de bord admin personnalisé.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from .models import Deposit, Withdrawal, AdminNotification

User = get_user_model()


def get_user_recent_actions(limit=20):
    """
    Récupère les actions récentes des utilisateurs pour affichage dans le tableau de bord admin.
    
    Retourne une liste d'actions incluant:
    - Dépôts
    - Retraits
    - Réinitialisations de mot de passe
    
    Args:
        limit (int): Nombre maximum d'actions à retourner
    
    Returns:
        list: Liste de dictionnaires contenant les détails des actions
    """
    actions = []
    
    # 1. Récupérer les dépôts récents (derniers 7 jours)
    recent_deposits = Deposit.objects.select_related('user').filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).order_by('-created_at')[:limit]
    
    for deposit in recent_deposits:
        status_display = dict(Deposit.STATUS_CHOICES).get(deposit.status, deposit.status)
        
        details = f"""
            <strong>{deposit.amount} {deposit.currency}</strong><br>
            <span style="color: #6c757d; font-size: 12px;">
                {'ID externe: ' + deposit.external_id if deposit.external_id else 'En attente de paiement'}
            </span>
        """
        
        actions.append({
            'timestamp': deposit.created_at,
            'user_id': deposit.user.id,
            'user_name': deposit.user.username,
            'user_email': deposit.user.email,
            'action_type': 'deposit',
            'action_display': '💰 Dépôt',
            'details': details,
            'status': deposit.status,
            'status_display': status_display,
            'admin_url': reverse('admin:api_deposit_change', args=[deposit.id]),
        })
    
    # 2. Récupérer les retraits récents (derniers 7 jours)
    recent_withdrawals = Withdrawal.objects.select_related('user', 'processed_by').filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).order_by('-created_at')[:limit]
    
    for withdrawal in recent_withdrawals:
        status_display = dict(Withdrawal.STATUS_CHOICES).get(withdrawal.status, withdrawal.status)
        
        details = f"""
            <strong>{withdrawal.amount} USDT</strong><br>
            <span style="color: #6c757d; font-size: 12px;">
                Vers: {withdrawal.bank} - {withdrawal.account[:15]}...
            </span>
        """
        
        if withdrawal.processed_by:
            details += f"""<br><span style="color: #28a745; font-size: 11px;">
                Traité par: {withdrawal.processed_by.username}
            </span>"""
        
        actions.append({
            'timestamp': withdrawal.created_at,
            'user_id': withdrawal.user.id,
            'user_name': withdrawal.user.username,
            'user_email': withdrawal.user.email,
            'action_type': 'withdrawal',
            'action_display': '🏦 Retrait',
            'details': details,
            'status': withdrawal.status,
            'status_display': status_display,
            'admin_url': reverse('admin:api_withdrawal_change', args=[withdrawal.id]),
        })
    
    # 3. Récupérer les réinitialisations de mot de passe récentes
    # Django LogEntry pour les changements de password
    from django.contrib.admin.models import LogEntry, CHANGE
    from django.contrib.contenttypes.models import ContentType
    
    user_content_type = ContentType.objects.get_for_model(User)
    
    password_resets = LogEntry.objects.filter(
        content_type=user_content_type,
        action_flag=CHANGE,
        change_message__icontains='password',
        action_time__gte=timezone.now() - timedelta(days=7)
    ).select_related('user').order_by('-action_time')[:limit//2]
    
    for log in password_resets:
        try:
            affected_user = User.objects.get(pk=log.object_id)
            
            details = f"""
                <span style="color: #6c757d; font-size: 12px;">
                    Mot de passe modifié
                </span>
            """
            
            if log.user:
                details += f"""<br><span style="color: #dc3545; font-size: 11px;">
                    Par: {log.user.username}
                </span>"""
            
            actions.append({
                'timestamp': log.action_time,
                'user_id': affected_user.id,
                'user_name': affected_user.username,
                'user_email': affected_user.email,
                'action_type': 'password_reset',
                'action_display': '🔐 Réinitialisation',
                'details': details,
                'status': 'success',
                'status_display': 'Complété',
                'admin_url': reverse('admin:auth_user_change', args=[affected_user.id]),
            })
        except User.DoesNotExist:
            continue
    
    # Trier toutes les actions par date (plus récente en premier)
    actions.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Limiter au nombre demandé
    return actions[:limit]


def get_dashboard_statistics():
    """
    Récupère des statistiques pour le tableau de bord admin.
    
    Returns:
        dict: Dictionnaire contenant diverses statistiques
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    
    stats = {
        # Dépôts
        'deposits_pending': Deposit.objects.filter(status='pending').count(),
        'deposits_today': Deposit.objects.filter(created_at__gte=today_start).count(),
        'deposits_week': Deposit.objects.filter(created_at__gte=week_start).count(),
        
        # Retraits
        'withdrawals_pending': Withdrawal.objects.filter(status='pending').count(),
        'withdrawals_processing': Withdrawal.objects.filter(status='processing').count(),
        'withdrawals_today': Withdrawal.objects.filter(created_at__gte=today_start).count(),
        'withdrawals_week': Withdrawal.objects.filter(created_at__gte=week_start).count(),
        
        # Utilisateurs
        'users_total': User.objects.count(),
        'users_today': User.objects.filter(date_joined__gte=today_start).count(),
        'users_week': User.objects.filter(date_joined__gte=week_start).count(),
        'users_active': User.objects.filter(is_active=True).count(),
    }
    
    return stats


def get_pending_actions_count():
    """
    Compte le nombre d'actions en attente nécessitant l'attention de l'admin.
    
    Returns:
        dict: Compteurs des différentes actions en attente
    """
    return {
        'deposits_pending': Deposit.objects.filter(status='pending').count(),
        'withdrawals_pending': Withdrawal.objects.filter(
            status__in=['pending', 'processing']
        ).count(),
        'notifications_unread': AdminNotification.objects.filter(is_read=False).count(),
    }
