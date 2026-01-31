from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from .models import MarketOffer, Wallet, Transaction, Deposit, Investor
from .models import ReferralCode, Referral, VIPLevel, UserVIPSubscription, Operateur, UserBankAccount
from .models import Withdrawal, AdminNotification, CryptoAddress, SocialLinks
from .admin_site import admin_site


class MarketOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'price_offered', 'status', 'created_at')


class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'currency', 'available', 'pending', 'gains')


class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet', 'amount', 'type', 'created_at')


class DepositAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'status', 'created_at')


class InvestorAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'total_invested', 'portfolio_value', 'created_at')


class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'referrer', 'created_at')


class ReferralAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'referred_user', 'status', 'created_at', 'used_at')


class VIPLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'level', 'title', 'price', 'percentage', 'daily_gains', 'delay_days', 'created_at')
    list_filter = ('level',)
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


class UserBankAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'account_type', 'account_holder_name', 'account_number', 'is_default', 'is_active', 'created_at')
    list_filter = ('account_type', 'is_active', 'is_default')
    search_fields = ('user__username', 'user__email', 'account_holder_name', 'account_number', 'bank_name', 'operator_name')
    raw_id_fields = ('user',)
    ordering = ('-is_default', '-created_at')


class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'bank', 'account', 'status', 'processed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__email', 'bank', 'account')
    raw_id_fields = ('user', 'processed_by')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    ordering = ('-created_at',)
    fieldsets = (
        ('Informations de l utilisateur', {'fields': ('user',)}),
        ('Détails du retrait', {'fields': ('amount', 'bank', 'account', 'status')}),
        ('Traitement administrateur', {'fields': ('processed_by', 'processed_at', 'reason_rejected')}),
        ('Horodatage', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type', 'amount', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'account_info')
    raw_id_fields = ('user', 'admin', 'deposit', 'withdrawal')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    fieldsets = (
        ('Notifications', {'fields': ('admin', 'user', 'notification_type', 'amount')}),
        ('Détails du compte', {'fields': ('account_info',)}),
        ('Statut', {'fields': ('is_read', 'deposit', 'withdrawal')}),
        ('Horodatage', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )


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


admin_site.register(MarketOffer, MarketOfferAdmin)
admin_site.register(Wallet, WalletAdmin)
admin_site.register(Transaction, TransactionAdmin)
admin_site.register(Deposit, DepositAdmin)
admin_site.register(Investor, InvestorAdmin)
admin_site.register(ReferralCode, ReferralCodeAdmin)
admin_site.register(Referral, ReferralAdmin)
admin_site.register(VIPLevel, VIPLevelAdmin)
admin_site.register(UserVIPSubscription, UserVIPSubscriptionAdmin)
admin_site.register(Operateur, OperateurAdmin)
admin_site.register(UserBankAccount, UserBankAccountAdmin)
admin_site.register(Withdrawal, WithdrawalAdmin)
admin_site.register(AdminNotification, AdminNotificationAdmin)
admin_site.register(CryptoAddress, CryptoAddressAdmin)
admin_site.register(SocialLinks, SocialLinksAdmin)
admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)
