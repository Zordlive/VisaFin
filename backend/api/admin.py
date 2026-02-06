from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.utils.html import format_html
from .models import MarketOffer, Wallet, Transaction, Deposit, Investor
from .models import ReferralCode, Referral, ReferralReward, VIPLevel, UserVIPSubscription, Operateur
from .models import Withdrawal, AdminNotification, CryptoAddress, SocialLinks, UserNotification, AboutPage, SupportTicket, SupportMessage


class MarketOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'price_offered', 'status', 'created_at')


class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'currency', 'available', 'pending', 'gains')


class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet', 'amount', 'type', 'created_at')


class DepositAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'status_colored', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('user__username', 'user__email', 'external_id')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'external_id')
    ordering = ('-created_at',)
    actions = ['approve_deposits', 'reject_deposits']
    fieldsets = (
        ('Informations', {'fields': ('user', 'amount', 'currency', 'status')}),
        ('Détails', {'fields': ('external_id',)}),
        ('Horodatage', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )
    
    def status_colored(self, obj):
        colors = {
            'pending': 'orange',
            'awaiting_payment': 'blue',
            'completed': 'green',
            'failed': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Statut'
    
    def approve_deposits(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='completed')
        self.message_user(request, f'{updated} dépôt(s) approuvé(s) avec succès.')
    approve_deposits.short_description = '✅ Approuver les dépôts sélectionnés'
    
    def reject_deposits(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='failed')
        self.message_user(request, f'{updated} dépôt(s) rejeté(s).')
    reject_deposits.short_description = '❌ Rejeter les dépôts sélectionnés'


class InvestorAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'total_invested', 'portfolio_value', 'created_at')


class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'referrer', 'created_at')


class ReferralAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'referred_user', 'generation_display', 'status', 'first_deposit_reward_processed', 'created_at')
    list_filter = ('status', 'generation', 'first_deposit_reward_processed', 'created_at')
    search_fields = ('referred_user__username', 'referred_user__email', 'code__code')
    raw_id_fields = ('code', 'referred_user', 'parent_referral')
    readonly_fields = ('created_at', 'used_at')
    ordering = ('-created_at',)
    fieldsets = (
        ('Informations de base', {'fields': ('code', 'referred_user', 'status')}),
        ('Générations', {'fields': ('generation', 'parent_referral', 'first_deposit_reward_processed')}),
        ('Horodatage', {'fields': ('created_at', 'used_at'), 'classes': ('collapse',)}),
        ('Métadonnées', {'fields': ('meta',), 'classes': ('collapse',)}),
    )
    
    def generation_display(self, obj):
        icons = {1: '👨‍👧‍👦', 2: '👧‍👧', 3: '👶'}
        icon = icons.get(obj.generation, '❓')
        return format_html(
            '{} <span style="color: #666;">(Gen {})</span>',
            icon,
            obj.generation
        )
    generation_display.short_description = 'Génération'


class VIPLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'level', 'title', 'price', 'percentage', 'daily_gains', 'delay_days', 'created_at')
    list_filter = ('level',)


# Ensure default auth models are unregistered before re-registering
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass
    search_fields = ('title', 'description')
    ordering = ('level',)


class UserVIPSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'vip_level', 'purchased_at', 'active')
    list_filter = ('active', 'vip_level')
    search_fields = ('user__username', 'user__email')
    raw_id_fields = ('user', 'vip_level')


class OperateurAdmin(admin.ModelAdmin):
    list_display = ('id', 'operateur', 'nom_agent', 'numero_agent', 'created_at')
    list_filter = ('operateur',)
    search_fields = ('nom_agent', 'numero_agent')
    ordering = ('operateur', 'nom_agent')


class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'bank', 'account', 'status_colored', 'processed_by', 'created_at')
    list_filter = ('status', 'created_at', 'processed_at')
    search_fields = ('user__username', 'user__email', 'bank', 'account')
    raw_id_fields = ('user', 'processed_by')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    ordering = ('-created_at',)
    actions = ['approve_withdrawals', 'reject_withdrawals']
    fieldsets = (
        ('Informations de l utilisateur', {'fields': ('user',)}),
        ('Détails du retrait', {'fields': ('amount', 'bank', 'account', 'status')}),
        ('Traitement administrateur', {'fields': ('processed_by', 'processed_at', 'reason_rejected')}),
        ('Horodatage', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    
    def status_colored(self, obj):
        colors = {
            'pending': 'orange',
            'processing': 'blue',
            'completed': 'green',
            'rejected': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Statut'
    
    def approve_withdrawals(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='pending').update(
            status='completed',
            processed_by=request.user,
            processed_at=timezone.now()
        )
        self.message_user(request, f'{updated} demande(s) de retrait approuvée(s) avec succès.')
    approve_withdrawals.short_description = '✅ Approuver les retraits sélectionnés'
    
    def reject_withdrawals(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='pending').update(
            status='rejected',
            processed_by=request.user,
            processed_at=timezone.now(),
            reason_rejected='Rejeté par l\'administrateur'
        )
        self.message_user(request, f'{updated} demande(s) de retrait rejetée(s).')
    reject_withdrawals.short_description = '❌ Rejeter les retraits sélectionnés'


class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type_colored', 'amount', 'account_info', 'is_read_colored', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'account_info')
    raw_id_fields = ('user', 'admin', 'deposit', 'withdrawal')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    actions = ['mark_as_read', 'mark_as_unread']
    fieldsets = (
        ('Notifications', {'fields': ('admin', 'user', 'notification_type', 'amount')}),
        ('Détails du compte', {'fields': ('account_info',)}),
        ('Statut', {'fields': ('is_read', 'deposit', 'withdrawal')}),
        ('Horodatage', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )
    
    def notification_type_colored(self, obj):
        colors = {
            'deposit': 'green',
            'withdrawal': 'orange',
        }
        color = colors.get(obj.notification_type, 'gray')
        icons = {
            'deposit': '💸',
            'withdrawal': '💰',
        }
        icon = icons.get(obj.notification_type, '')
        return format_html(
            '<span style="color: {};">{} {}</span>',
            color,
            icon,
            obj.get_notification_type_display()
        )
    notification_type_colored.short_description = 'Type'
    
    def is_read_colored(self, obj):
        if obj.is_read:
            return format_html('<span style="color: green;">✓ Lu</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Non lu</span>')
    is_read_colored.short_description = 'Statut de lecture'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme lue(s).')
    mark_as_read.short_description = '✓ Marquer comme lu'
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme non lue(s).')
    mark_as_unread.short_description = '✗ Marquer comme non lu'


class CryptoAddressAdmin(admin.ModelAdmin):
    list_display = ('network', 'address_preview', 'is_active', 'updated_at')
    list_filter = ('network', 'is_active')
    search_fields = ('address',)
    ordering = ('network',)
    fieldsets = (
        ('Informations du réseau', {'fields': ('network', 'address', 'is_active')}),
        ('Horodatage', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')
    
    def address_preview(self, obj):
        if len(obj.address) > 30:
            return f"{obj.address[:15]}...{obj.address[-15:]}"
        return obj.address
    address_preview.short_description = 'Adresse'


class SocialLinksAdmin(admin.ModelAdmin):
    list_display = ('id', 'has_whatsapp', 'has_telegram', 'updated_at')
    fieldsets = (
        ('Liens WhatsApp', {'fields': ('whatsapp_channel', 'whatsapp_group')}),
        ('Liens Telegram', {'fields': ('telegram_channel', 'telegram_group')}),
        ('Horodatage', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')

    def has_whatsapp(self, obj):
        return bool(obj.whatsapp_channel or obj.whatsapp_group)
    has_whatsapp.boolean = True
    has_whatsapp.short_description = 'WhatsApp configuré'

    def has_telegram(self, obj):
        return bool(obj.telegram_channel or obj.telegram_group)
    has_telegram.boolean = True
    has_telegram.short_description = 'Telegram configuré'

    def has_add_permission(self, request):
        # Limiter à une seule instance
        return not SocialLinks.objects.exists()

class AboutPageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'updated_at')
    search_fields = ('title', 'subtitle', 'historique', 'mission', 'vision', 'values')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Contenu', {'fields': ('title', 'subtitle', 'historique', 'mission', 'vision', 'values')}),
        ('Informations', {'fields': ('founded_year', 'headquarters', 'contact_email', 'contact_phone')}),
        ('Image', {'fields': ('image',)}),
        ('Horodatage', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def has_add_permission(self, request):
        # Limiter à une seule instance
        return not AboutPage.objects.exists()


class ReferralRewardAdmin(admin.ModelAdmin):
    list_display = ('id', 'referral', 'amount_formatted', 'reward_type_colored', 'deposit', 'created_at')
    list_filter = ('reward_type', 'created_at')
    search_fields = ('referral__code__code', 'referral__referred_user__username', 'deposit__user__username')
    raw_id_fields = ('referral', 'transaction', 'deposit')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    fieldsets = (
        ('Parrainage', {'fields': ('referral', 'deposit')}),
        ('Récompense', {'fields': ('amount', 'reward_type')}),
        ('Transaction', {'fields': ('transaction',)}),
        ('Horodatage', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )
    
    def amount_formatted(self, obj):
        return format_html(
            '<span style="color: green; font-weight: bold;">{} USDT</span>',
            obj.amount
        )
    amount_formatted.short_description = 'Montant'
    
    def reward_type_colored(self, obj):
        colors = {
            'direct_generation1': 'blue',
            'indirect_generation2': 'orange',
            'indirect_generation3': 'purple',
        }
        color = colors.get(obj.reward_type, 'gray')
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            obj.get_reward_type_display()
        )
    reward_type_colored.short_description = 'Type de commission'


class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type_colored', 'title', 'is_read_colored', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'title', 'message')
    raw_id_fields = ('user', 'withdrawal', 'deposit')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    actions = ['mark_as_read', 'mark_as_unread']
    fieldsets = (
        ('Utilisateur', {'fields': ('user', 'notification_type')}),
        ('Contenu', {'fields': ('title', 'message')}),
        ('Statut', {'fields': ('is_read',)}),
        ('Références', {'fields': ('withdrawal', 'deposit')}),
        ('Horodatage', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )
    
    def notification_type_colored(self, obj):
        colors = {
            'withdrawal_approved': 'green',
            'withdrawal_rejected': 'red',
            'deposit_approved': 'green',
            'deposit_rejected': 'red',
            'general': 'blue',
        }
        color = colors.get(obj.notification_type, 'gray')
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            obj.get_notification_type_display()
        )
    notification_type_colored.short_description = 'Type'
    
    def is_read_colored(self, obj):
        if obj.is_read:
            return format_html('<span style="color: green;">✓ Lu</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Non lu</span>')
    is_read_colored.short_description = 'Statut'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme lue(s).')
    mark_as_read.short_description = '✓ Marquer comme lu'
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme non lue(s).')
    mark_as_unread.short_description = '✗ Marquer comme non lu'


admin.site.register(MarketOffer, MarketOfferAdmin)
admin.site.register(Wallet, WalletAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Deposit, DepositAdmin)
admin.site.register(Investor, InvestorAdmin)
admin.site.register(ReferralCode, ReferralCodeAdmin)
admin.site.register(Referral, ReferralAdmin)
admin.site.register(ReferralReward, ReferralRewardAdmin)
admin.site.register(VIPLevel, VIPLevelAdmin)
admin.site.register(UserVIPSubscription, UserVIPSubscriptionAdmin)
admin.site.register(Operateur, OperateurAdmin)
admin.site.register(Withdrawal, WithdrawalAdmin)
admin.site.register(AdminNotification, AdminNotificationAdmin)
admin.site.register(UserNotification, UserNotificationAdmin)
admin.site.register(CryptoAddress, CryptoAddressAdmin)
admin.site.register(SocialLinks, SocialLinksAdmin)
admin.site.register(AboutPage, AboutPageAdmin)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'subject', 'status', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__email', 'subject')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-updated_at',)


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'sender', 'sender_role', 'created_at')
    list_filter = ('sender_role', 'created_at')
    search_fields = ('content', 'sender__username', 'sender__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
admin.site.register(User, UserAdmin)
admin.site.register(Group, GroupAdmin)
