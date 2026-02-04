from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from .models import MarketOffer, Wallet, Transaction, Deposit, Investor, VIPLevel, UserVIPSubscription, Operateur, UserBankAccount, Withdrawal, AdminNotification, CryptoAddress, SocialLinks

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()
    vip_level = serializers.SerializerMethodField()
    vip_since = serializers.SerializerMethodField()
    total_invested = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'email', 'phone', 'vip_level', 'vip_since', 'total_invested')

    def get_phone(self, obj):
        try:
            return obj.investor.phone
        except Exception:
            return None

    def get_vip_level(self, obj):
        try:
            return getattr(obj.investor, 'vip_level', 0)
        except Exception:
            return 0

    def get_vip_since(self, obj):
        try:
            v = getattr(obj.investor, 'vip_since', None)
            return v
        except Exception:
            return None

    def get_total_invested(self, obj):
        try:
            return getattr(obj.investor, 'total_invested', 0)
        except Exception:
            return 0


class MarketOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketOffer
        fields = (
            'id', 'title', 'description', 'price_offered', 'status', 'expires_at', 'created_at'
        )


class WalletSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Wallet
        fields = ('id', 'user', 'currency', 'available', 'pending', 'gains', 'sale_balance', 'invested')


class InvestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investor
        fields = ('phone', 'total_invested', 'portfolio_value', 'vip_level', 'vip_since')


class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ('id', 'user', 'amount', 'currency', 'status', 'external_id', 'created_at')



class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'wallet', 'amount', 'type', 'created_at')


class InvestmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    wallet = WalletSerializer(read_only=True)

    class Meta:
        model = __import__('api.models', fromlist=['Investment']).Investment
        fields = ('id', 'user', 'wallet', 'amount', 'daily_rate', 'accrued', 'last_accrual', 'created_at', 'active')


class TradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = __import__('api.models', fromlist=['Trade']).Trade
        fields = ('id', 'offer_id', 'seller', 'amount', 'price', 'surplus', 'buyer_info', 'created_at')


class ReferralCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = __import__('api.models', fromlist=['ReferralCode']).ReferralCode
        fields = ('id', 'code', 'referrer', 'created_at')



class ReferralSerializer(serializers.ModelSerializer):
    referred_user = UserSerializer(read_only=True)
    code = ReferralCodeSerializer(read_only=True)

    class Meta:
        model = __import__('api.models', fromlist=['Referral']).Referral
        fields = ('id', 'code', 'referred_user', 'status', 'created_at', 'used_at', 'meta')


class RegisterEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Un compte existe déjà pour cet e‑mail.')
        return value

    def create(self, validated_data):
        email = validated_data['email']
        username = email
        # random password for initial creation; user will set password after verification
        from django.contrib.auth.models import User as DjangoUser
        password = DjangoUser.objects.make_random_password()
        user = DjangoUser.objects.create_user(username=username, email=email, password=password)
        user.is_active = False
        user.save()
        # create investor placeholder
        try:
            Investor.objects.create(user=user)
        except Exception:
            pass
        return user


class SetPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)

    def validate(self, data):
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str
        try:
            uid = force_str(urlsafe_base64_decode(data.get('uidb64')))
            user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError('Lien invalide.')
        from django.contrib.auth.tokens import default_token_generator
        if not default_token_generator.check_token(user, data.get('token')):
            raise serializers.ValidationError('Token invalide ou expiré.')
        data['user'] = user
        return data

    def save(self):
        user = self.validated_data['user']
        password = self.validated_data['password']
        user.set_password(password)
        user.is_active = True
        user.save()
        return user


class VIPLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = VIPLevel
        fields = ('id', 'level', 'title', 'price', 'percentage', 'daily_gains', 'delay_days', 'description', 'created_at')


class UserVIPSubscriptionSerializer(serializers.ModelSerializer):
    vip_level = VIPLevelSerializer(read_only=True)

    class Meta:
        model = UserVIPSubscription
        fields = ('id', 'vip_level', 'purchased_at', 'active')

class OperateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operateur
        fields = ('id', 'numero_agent', 'nom_agent', 'operateur', 'created_at')


class UserBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBankAccount
        fields = ('id', 'account_type', 'bank_name', 'operator_name', 'account_number', 'account_holder_name', 'is_active', 'is_default', 'created_at')
        read_only_fields = ('created_at',)

    def validate(self, data):
        # Validation: si account_type est 'bank', bank_name est requis
        if data.get('account_type') == 'bank' and not data.get('bank_name'):
            raise serializers.ValidationError({'bank_name': 'Le nom de la banque est requis pour un compte bancaire.'})
        
        # Validation: si account_type est 'operator', operator_name est requis
        if data.get('account_type') == 'operator' and not data.get('operator_name'):
            raise serializers.ValidationError({'operator_name': 'Le nom de l\'opérateur est requis pour un compte opérateur.'})
        
        return data


class WithdrawalSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.SerializerMethodField()
    processed_by_username = serializers.CharField(source='processed_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Withdrawal
        fields = ('id', 'user', 'user_username', 'user_email', 'user_phone', 'amount', 'bank', 'account', 'status', 'reason_rejected', 'processed_by', 'processed_by_username', 'processed_at', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_user_phone(self, obj):
        try:
            return obj.user.investor.phone
        except Exception:
            return None


class AdminNotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.SerializerMethodField()
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = AdminNotification
        fields = ('id', 'admin', 'user', 'user_username', 'user_email', 'user_phone', 'notification_type', 'notification_type_display', 'amount', 'account_info', 'is_read', 'deposit', 'withdrawal', 'created_at')
        read_only_fields = ('id', 'created_at', 'admin')

    def get_user_phone(self, obj):
        try:
            return obj.user.investor.phone
        except Exception:
            return None


class CryptoAddressSerializer(serializers.ModelSerializer):
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    
    class Meta:
        model = CryptoAddress
        fields = ('id', 'network', 'network_display', 'address', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class SocialLinksSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLinks
        fields = ('id', 'whatsapp_channel', 'whatsapp_group', 'telegram_channel', 'telegram_group', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')