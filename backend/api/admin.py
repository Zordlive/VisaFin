from django.contrib import admin
from .models import MarketOffer, Wallet, Transaction, Deposit, Investor
from .models import ReferralCode, Referral, VIPLevel, UserVIPSubscription, Operateur, UserBankAccount
from .models import Withdrawal, AdminNotification


@admin.register(MarketOffer)
class MarketOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'price_offered', 'status', 'created_at')


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'currency', 'available', 'pending', 'gains')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet', 'amount', 'type', 'created_at')


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'status', 'created_at')


@admin.register(Investor)
class InvestorAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'total_invested', 'portfolio_value', 'created_at')


@admin.register(ReferralCode)
class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'referrer', 'created_at')


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'referred_user', 'status', 'created_at', 'used_at')


@admin.register(VIPLevel)
class VIPLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'level', 'title', 'price', 'percentage', 'daily_gains', 'delay_days', 'created_at')
    list_filter = ('level',)
    search_fields = ('title', 'description')
    ordering = ('level',)


@admin.register(UserVIPSubscription)
class UserVIPSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'vip_level', 'purchased_at', 'active')
    list_filter = ('active', 'vip_level')
    search_fields = ('user__username', 'user__email')
    raw_id_fields = ('user', 'vip_level')


@admin.register(Operateur)
class OperateurAdmin(admin.ModelAdmin):
    list_display = ('id', 'operateur', 'nom_agent', 'numero_agent', 'created_at')
    list_filter = ('operateur',)
    search_fields = ('nom_agent', 'numero_agent')
    ordering = ('operateur', 'nom_agent')


@admin.register(UserBankAccount)
class UserBankAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'account_type', 'account_holder_name', 'account_number', 'is_default', 'is_active', 'created_at')
    list_filter = ('account_type', 'is_active', 'is_default')
    search_fields = ('user__username', 'user__email', 'account_holder_name', 'account_number', 'bank_name', 'operator_name')
    raw_id_fields = ('user',)
    ordering = ('-is_default', '-created_at')


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'bank', 'account', 'status', 'processed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__email', 'bank', 'account')
    raw_id_fields = ('user', 'processed_by')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Informations de l\'utilisateur', {
            'fields': ('user',)
        }),
        ('Détails du retrait', {
            'fields': ('amount', 'bank', 'account', 'status')
        }),
        ('Traitement administrateur', {
            'fields': ('processed_by', 'processed_at', 'reason_rejected')
        }),
        ('Horodatage', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type', 'amount', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'account_info')
    raw_id_fields = ('user', 'admin', 'deposit', 'withdrawal')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Notifications', {
            'fields': ('admin', 'user', 'notification_type', 'amount')
        }),
        ('Détails du compte', {
            'fields': ('account_info',)
        }),
        ('Statut', {
            'fields': ('is_read', 'deposit', 'withdrawal')
        }),
        ('Horodatage', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
