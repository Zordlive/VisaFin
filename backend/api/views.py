# Import de APIView pour AdminReferralsView
from rest_framework.views import APIView
# Vue pour /referrals/all/ : retourne tous les parrainages (admin only)
from rest_framework.permissions import IsAdminUser

class AdminReferralsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .models import Referral
        from .serializers import ReferralSerializer
        referrals = Referral.objects.all()
        serializer = ReferralSerializer(referrals, many=True)
        return Response(serializer.data)
# Vue pour /referrals/me : retourne les parrainages de l'utilisateur connecté
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class ReferralsMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Referral, ReferralCode
        from .serializers import ReferralSerializer, ReferralCodeSerializer
        # Récupérer le code de parrainage de l'utilisateur
        code_obj = ReferralCode.objects.filter(referrer=request.user).first()
        code_data = ReferralCodeSerializer(code_obj).data if code_obj else None

        # Récupérer les filleuls
        referrals = Referral.objects.filter(code__referrer=request.user)
        serializer = ReferralSerializer(referrals, many=True)

        # Statistiques simples
        stats = {
            'total_referred': referrals.count(),
            'used': referrals.filter(status='used').count(),
            'pending': referrals.filter(status='pending').count(),
            'vip_breakdown': {},
        }
        # Répartition par niveau VIP (si possible)
        try:
            from django.db.models import Count
            vip_counts = referrals.values('referred_user__investor__vip_level').annotate(count=Count('id'))
            for entry in vip_counts:
                level = entry['referred_user__investor__vip_level'] or 0
                stats['vip_breakdown'][f'niveau_{level}'] = entry['count']
        except Exception:
            pass

        return Response({
            'code': code_data,
            'referrals': serializer.data,
            'stats': stats,
        })
# Import de AllowAny pour le ViewSet
from rest_framework.permissions import AllowAny
# Import du serializer CryptoAddressSerializer pour le ViewSet
from .serializers import CryptoAddressSerializer
# Import du modèle CryptoAddress pour le ViewSet
from .models import CryptoAddress
# Assure l'import de viewsets avant tout ViewSet custom
from rest_framework import viewsets
# CryptoAddressViewSet (lecture seule)
class CryptoAddressViewSet(viewsets.ReadOnlyModelViewSet):
    """Permet de lister les adresses crypto actives (lecture seule)."""
    queryset = CryptoAddress.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = CryptoAddressSerializer
    permission_classes = [AllowAny]


from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from django.db.models import Count, Avg, Max, Sum, Q
import logging

logger = logging.getLogger(__name__)


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})


def compute_vip_level(total_invested):
    """Compute VIP level using doubling thresholds starting at a base value.

    By default: VIP1 = 25_000, VIP2 = 50_000, VIP3 = 100_000, etc.
    Returns integer level (0 for none).
    """
    from decimal import Decimal
    base = Decimal(getattr(settings, 'VIP_FIRST_THRESHOLD', 25000))
    if total_invested is None:
        return 0
    try:
        t = Decimal(str(total_invested))
    except Exception:
        return 0

    level = 0
    threshold = base
    while t >= threshold:
        level += 1
        threshold = threshold * Decimal(2)
    return level

from .models import MarketOffer, Wallet, Transaction, Deposit, Investor, Trade, HiddenOffer, VIPLevel, UserVIPSubscription, Investment, Operateur, UserBankAccount, Withdrawal, AdminNotification, CryptoAddress, SocialLinks, AboutPage, SupportTicket, SupportMessage, ReferralReward
from .utils import recompute_vip_for_user
from .models import ReferralCode, Referral

from .serializers import (
    MarketOfferSerializer,
    TradeSerializer,
    ReferralCodeSerializer,
    ReferralSerializer,
    WalletSerializer,
    TransactionSerializer,
    DepositSerializer,
    UserSerializer,
    InvestmentSerializer,
    VIPLevelSerializer,
    UserVIPSubscriptionSerializer,
    OperateurSerializer,
    UserBankAccountSerializer,
    WithdrawalSerializer,
    AdminNotificationSerializer,
    CryptoAddressSerializer,
    SocialLinksSerializer,
    AboutPageSerializer,
    SupportTicketSerializer,
    SupportMessageSerializer,
)



from rest_framework.permissions import AllowAny

# --- ViewSets lecture seule regroupés après tous les imports ---
class VIPLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """Permet de lister les niveaux VIP (lecture seule)."""
    queryset = VIPLevel.objects.all().order_by('level')
    serializer_class = VIPLevelSerializer
    permission_classes = [AllowAny]

class OperateurViewSet(viewsets.ReadOnlyModelViewSet):
    """Permet de lister les opérateurs (lecture seule)."""
    queryset = Operateur.objects.all().order_by('id')
    serializer_class = OperateurSerializer
    permission_classes = [AllowAny]

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class MarketOfferViewSet(viewsets.ModelViewSet):
    serializer_class = MarketOfferSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = MarketOffer.objects.all().order_by('-created_at')
        # Restriction VIP >= 3
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated:
            try:
                vip_level = getattr(user, 'investor', None)
                vip_level = getattr(vip_level, 'vip_level', 0) if vip_level else 0
            except Exception:
                vip_level = 0
            if vip_level < 3:
                return MarketOffer.objects.none()
        else:
            # Non connecté : aucune offre
            return MarketOffer.objects.none()

        # optional filters via query params
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        # exclude offers hidden for this user or globally until a future time
        try:
            now = timezone.now()
            hidden_qs = HiddenOffer.objects.filter(hidden_until__gt=now).filter(
                Q(user__isnull=True) | Q(user=user)
            )
            hidden_ids = list(hidden_qs.values_list('offer_id', flat=True))
            if hidden_ids:
                qs = qs.exclude(id__in=hidden_ids)
        except Exception:
            pass
        return qs


class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def transfer_gains(self, request, pk=None):
        """Transfer amount from wallet.gains to wallet.available for the owner. Invested funds are locked for 180 days."""
        from decimal import Decimal, ROUND_DOWN
        from django.db import transaction
        from django.utils import timezone as _tz
        from datetime import timedelta

        amount = request.data.get('amount')
        source = request.data.get('source', 'gains')
        if amount is None:
            return Response({'message': "Le montant est requis"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amt = Decimal(str(amount))
        except Exception:
            return Response({'message': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

        if amt <= Decimal('0'):
            return Response({'message': 'Le montant doit être positif'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            logger.debug('transfer_gains request: wallet=%s user=%s raw_amount=%s source=%s', pk, getattr(request.user, 'id', None), amount, source)
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=pk, user=request.user)
                logger.debug('wallet before transfer: id=%s available=%s gains=%s sale_balance=%s', w.pk, w.available, w.gains, getattr(w, 'sale_balance', None))

                if source == 'gains':
                    if w.gains < amt:
                        return Response({'message': 'Gains insuffisants'}, status=status.HTTP_400_BAD_REQUEST)
                    w.gains = (w.gains - amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    w.available = (w.available + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                elif source == 'sale':
                    # transfer from sale_balance (mapped to invested). Only allow transferring
                    # amounts that are withdrawable (investments older than 180 days).
                    try:
                        sb = w.sale_balance
                    except Exception:
                        sb = None
                    if sb is None or sb <= Decimal('0'):
                        return Response({'message': "Solde investi insuffisant"}, status=status.HTTP_400_BAD_REQUEST)

                    # compute withdrawable amount from investments tied to this wallet
                    cutoff = _tz.now() - timedelta(days=180)
                    Investment = __import__('api.models', fromlist=['Investment']).Investment
                    withdrawable_agg = Investment.objects.filter(wallet=w, active=True, created_at__lte=cutoff).aggregate(total=Sum('amount'))
                    withdrawable = withdrawable_agg.get('total') or Decimal('0')

                    if withdrawable < amt:
                        return Response({'message': 'Fonds investis verrouillés : seuls les investissements âgés de 180 jours peuvent être retirés'}, status=status.HTTP_400_BAD_REQUEST)

                    w.sale_balance = (w.sale_balance - amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    w.available = (w.available + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                else:
                    return Response({'message': 'source invalide'}, status=status.HTTP_400_BAD_REQUEST)

                w.save()

                Transaction.objects.create(wallet=w, amount=amt, type='transfer')

                return Response(WalletSerializer(w).data)
        except Wallet.DoesNotExist:
            return Response({'message': 'Portefeuille non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Log unexpected server error and return a safe message
            logger.exception('transfer_gains failed for wallet %s user %s', pk, request.user)
            return Response({'message': "Erreur serveur interne"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # limit transactions to wallets owned by the user
        return Transaction.objects.filter(wallet__user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        wallet = serializer.validated_data.get('wallet')
        # basic ownership check
        if wallet.user != self.request.user:
            raise PermissionError('Cannot create transactions for another user')
        serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def sell(self, request):
        # expected payload: { offer_id, amount, currency, otp? }
        data = request.data
        offer_id = data.get('offer_id')
        amount = data.get('amount')
        currency = data.get('currency')

        if not offer_id or not amount or not currency:
            return Response({'message': 'offer_id, amount and currency are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Very simple flow: create a Transaction with type 'trade' and return it.
        # In real app, we'd validate offer, balances, OTP, provider logic, etc.
        try:
            wallet = Wallet.objects.filter(user=request.user, currency=currency).first()
            if not wallet:
                return Response({'message': 'Wallet not found for currency'}, status=status.HTTP_404_NOT_FOUND)

            tx = Transaction.objects.create(wallet=wallet, amount=amount, type='trade')
            return Response(TransactionSerializer(tx).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'], url_path='clear', permission_classes=[IsAuthenticated])
    def clear_history(self, request):
        """Delete all transactions for the current user's wallets"""
        try:
            deleted_count = Transaction.objects.filter(wallet__user=request.user).delete()[0]
            return Response({
                'message': f'{deleted_count} transaction(s) supprimée(s)',
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DepositViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DepositSerializer

    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate(self, request):
        # Endpoint pour créer un dépôt FIAT
        # Payload attendu: { amount, currency, operateur, phone, type }
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'CDF')
        operateur = request.data.get('operateur')
        phone = request.data.get('phone')
        deposit_type = request.data.get('type', 'FIAT')
        
        if not amount:
            return Response({'message': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)

        deposit = Deposit.objects.create(
            user=request.user,
            amount=amount,
            currency=currency,
            status='pending',
            external_id=f'{deposit_type}_{operateur}_{phone}' if deposit_type == 'FIAT' else None
        )
        
        return Response({
            'deposit_id': deposit.id,
            'status': deposit.status,
            'amount': float(deposit.amount),
            'currency': deposit.currency
        })

    @action(detail=False, methods=['post'], url_path='')
    def create(self, request):
        """Créer un nouveau dépôt (FIAT ou CRYPTO)."""
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'USDT')
        channel = request.data.get('channel')
        txid = request.data.get('txid')
        operateur = request.data.get('operateur')
        phone = request.data.get('phone')
        deposit_type = request.data.get('type', 'FIAT')
        
        if not amount:
            return Response({'message': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Créer le dépôt
            if deposit_type == 'CRYPTO':
                external_id = f'CRYPTO_{channel}_{txid[:20]}'
            else:
                external_id = f'FIAT_{operateur}_{phone}'
            
            deposit = Deposit.objects.create(
                user=request.user,
                amount=amount,
                currency=currency,
                status='pending',
                external_id=external_id
            )
            
            # Créer une notification admin pour tous les admins
            admin_users = User.objects.filter(is_staff=True, is_active=True)
            for admin in admin_users:
                AdminNotification.objects.create(
                    admin=admin,
                    user=request.user,
                    notification_type='deposit',
                    amount=deposit.amount,
                    account_info=external_id,
                    deposit=deposit,
                    is_read=False
                )
            
            return Response({
                'deposit_id': deposit.id,
                'status': deposit.status,
                'amount': float(deposit.amount),
                'currency': deposit.currency,
                'message': 'Dépôt créé avec succès'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='status')
    def status(self, request, pk=None):
        try:
            deposit = Deposit.objects.get(pk=pk, user=request.user)
            return Response({'deposit_id': deposit.id, 'status': deposit.status})
        except Deposit.DoesNotExist:
            return Response({'message': 'not found'}, status=status.HTTP_404_NOT_FOUND)


def set_refresh_cookie(response, refresh_token):
    # set refresh token as httpOnly secure cookie (secure=False for dev)
    response.set_cookie('refresh', refresh_token, httponly=True, secure=False, samesite='Lax')
    return response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier') or request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        if not identifier or not password:
            return Response({'message': 'identifier and password required'}, status=status.HTTP_400_BAD_REQUEST)

        # try username/email/phone; use filter().first() to avoid MultipleObjectsReturned
        user = (
            User.objects.filter(username=identifier).first()
            or User.objects.filter(email=identifier).first()
        )
        if user is None:
            inv = Investor.objects.filter(phone=identifier).select_related('user').first()
            user = inv.user if inv else None

        if user is None or not user.check_password(password):
            return Response({'message': 'invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        user_data = UserSerializer(user).data
        # include refresh token in response body for development convenience
        resp = Response({'user': user_data, 'access_token': access_token, 'refresh_token': refresh_token})
        set_refresh_cookie(resp, refresh_token)
        return resp


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        phone = request.data.get('phone')
        password = request.data.get('password')
        country_code = request.data.get('countryCode')
        # Accept both 'ref' and 'referralCode' for flexibility
        ref_code = request.data.get('ref') or request.data.get('referralCode')

        if not name or not password:
            return Response({'message': 'name and password required'}, status=status.HTTP_400_BAD_REQUEST)

        username = email or name
        if User.objects.filter(username=username).exists():
            return Response({'message': 'user exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, first_name=name, email=email)
        user.set_password(password)
        user.save()

        # ensure an Investor record exists for this new user
        try:
            # store phone including country code when available
            full_phone = phone
            if country_code:
                try:
                    # include + if not present
                    cp = str(country_code)
                    if not cp.startswith('+'):
                        cp = f"+{cp}"
                    full_phone = f"{cp}{phone if phone else ''}"
                except Exception:
                    full_phone = phone

            Investor.objects.create(user=user, phone=full_phone)
            investor_created = True
        except Exception:
            investor_created = False

        # Do not auto-create wallets on registration
        wallets_created = []

        # create a referral code for this new user if not exists
        try:
            # generate a short unique code
            import secrets

            code = secrets.token_urlsafe(6)
            # ensure uniqueness
            while ReferralCode.objects.filter(code=code).exists():
                code = secrets.token_urlsafe(6)
            ReferralCode.objects.create(code=code, referrer=user)
        except Exception:
            pass

        # if a referral code was provided, link the referral.
        # We mark it as 'used' immediately and record the timestamp so the referrer sees the new referred user.
        referral_bonus = 0
        if ref_code:
            try:
                rc = ReferralCode.objects.filter(code__iexact=ref_code).first()
                if rc and rc.referrer != user:  # Don't create self-referrals
                    from django.utils import timezone as _tz
                    parent_referral = Referral.objects.filter(
                        referred_user=rc.referrer,
                        status='used'
                    ).order_by('created_at').first()

                    generation = 1
                    if parent_referral:
                        generation = min(int(parent_referral.generation or 1) + 1, 3)

                    Referral.objects.create(
                        code=rc,
                        referred_user=user,
                        status='used',
                        used_at=_tz.now(),
                        parent_referral=parent_referral,
                        generation=generation
                    )
            except Exception as e:
                # Log error but don't fail registration
                print(f"Referral processing error: {str(e)}")
                pass

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        user_data = UserSerializer(user).data
        resp = Response({
            'user': user_data,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'investor_created': investor_created,
            'referral_bonus': referral_bonus if 'referral_bonus' in locals() else 0
        })
        set_refresh_cookie(resp, refresh_token)
        return resp


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            from google.auth.transport import requests
            from google.oauth2 import id_token
            
            token = request.data.get('token')
            if not token:
                return Response({'message': 'token required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the token
            try:
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    requests.Request(), 
                    settings.GOOGLE_CLIENT_ID
                )
            except ValueError:
                return Response({'message': 'invalid token'}, status=status.HTTP_400_BAD_REQUEST)
            
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            picture = idinfo.get('picture', '')
            
            if not email:
                return Response({'message': 'email not provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create or get user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name
                }
            )
            
            # Create Investor record if doesn't exist
            if created:
                try:
                    Investor.objects.create(user=user)
                except Exception:
                    pass

                # Create referral code for new Google user if not exists
                from .models import ReferralCode, Referral
                import secrets
                if not ReferralCode.objects.filter(referrer=user).exists():
                    code = secrets.token_urlsafe(6)
                    while ReferralCode.objects.filter(code=code).exists():
                        code = secrets.token_urlsafe(6)
                    ReferralCode.objects.create(code=code, referrer=user)

                # Enregistrer le parrainage si un code est présent dans la requête
                ref_code = request.data.get('ref') or request.data.get('referralCode')
                if ref_code:
                    try:
                        rc = ReferralCode.objects.filter(code__iexact=ref_code).first()
                        if rc and rc.referrer != user:
                            from django.utils import timezone as _tz
                            parent_referral = Referral.objects.filter(
                                referred_user=rc.referrer,
                                status='used'
                            ).order_by('created_at').first()
                            generation = 1
                            if parent_referral:
                                generation = min(int(parent_referral.generation or 1) + 1, 3)
                            Referral.objects.create(
                                code=rc,
                                referred_user=user,
                                status='used',
                                used_at=_tz.now(),
                                parent_referral=parent_referral,
                                generation=generation
                            )
                    except Exception:
                        pass
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            user_data = UserSerializer(user).data
            
            resp = Response({
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'referral_bonus': 0
            })
            set_refresh_cookie(resp, refresh_token)
            return resp
            
        except Exception as e:
            logger.error(f"Google login error: {str(e)}")
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenFromCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Accept refresh token from JSON body (dev convenience). Cookie support optional.
        refresh_token = (
            request.data.get('refresh_token')
            or request.data.get('refresh')
            or request.data.get('token')
            or request.COOKIES.get('refresh')
        )
        if not refresh_token:
            return Response({'message': 'no refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
            return Response({'access_token': access})
        except Exception:
            return Response({'message': 'invalid token'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resp = Response({'message': 'logged out'})
        # delete cookie
        resp.delete_cookie('refresh')
        return resp


class RegisterEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import RegisterEmailSerializer
        serializer = RegisterEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend = getattr(settings, 'SITE_URL', 'http://localhost:5173')
        verify_link = f"{frontend}/auth/verify/{uid}/{token}"

        subject = "Vérifiez votre adresse e‑mail"
        message = (
            f"Bonjour,\n\nCliquez sur le lien suivant pour vérifier votre adresse e‑mail et activer votre compte:\n\n{verify_link}\n\n"
            "Si vous n'avez pas demandé ceci, ignorez cet e‑mail."
        )
        send_mail(subject, message, getattr(settings, 'DEFAULT_FROM_EMAIL', None), [user.email], fail_silently=False)

        return Response({'detail': 'E‑mail de vérification envoyé.'}, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'detail': 'Lien invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            # auto-login: create tokens and set refresh cookie
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            user_data = UserSerializer(user).data
            resp = Response({'user': user_data, 'access_token': access_token, 'refresh_token': refresh_token}, status=status.HTTP_200_OK)
            set_refresh_cookie(resp, refresh_token)
            return resp
        return Response({'detail': 'Lien expiré ou invalide.'}, status=status.HTTP_400_BAD_REQUEST)


class SetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import SetPasswordSerializer
        serializer = SetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # after password set, optional auto-login
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        user_data = UserSerializer(user).data
        resp = Response({'user': user_data, 'access_token': access_token, 'refresh_token': refresh_token}, status=status.HTTP_200_OK)
        set_refresh_cookie(resp, refresh_token)
        return resp


class TestLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not getattr(settings, 'ALLOW_TEST_LOGIN', False):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Create or reuse a test superuser
        username = 'testadmin'
        email = 'testadmin@example.com'
        password = 'TestAdmin123!'

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            user.set_password(password)
            user.save()
        else:
            # Ensure permissions in case user already existed
            if not user.is_staff or not user.is_superuser:
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.save()

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        user_data = UserSerializer(user).data

        resp = Response({
            'user': user_data,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'test_credentials': {
                'username': username,
                'password': password,
            }
        }, status=status.HTTP_200_OK)
        set_refresh_cookie(resp, refresh_token)
        return resp


class MeView(APIView):
    """Return the current authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ensure VIP level reflects current invested balances
        try:
            recompute_vip_for_user(request.user)
        except Exception:
            # best-effort, do not fail the request
            pass
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)


class UserUpdateView(APIView):
    """Update the current authenticated user."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        """Update user profile (PUT)."""
        user = request.user
        data = request.data

        # Update basic fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'email' in data:
            user.email = data['email']
        if 'password' in data and data['password']:
            user.set_password(data['password'])

        # Update phone via Investor profile
        if 'phone' in data:
            try:
                investor = Investor.objects.get(user=user)
                investor.phone = data['phone']
                investor.save()
            except Investor.DoesNotExist:
                return Response(
                    {'message': 'Investor profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Partial update of user profile (PATCH)."""
        # PATCH is same as PUT for this endpoint (partial updates)
        return self.put(request)





class InvestmentViewSet(viewsets.ViewSet):
    """Simple ViewSet to create/list investments and trigger accrual for a single investment."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='last', permission_classes=[IsAuthenticated])
    def last(self, request):
        """Retourne le dernier investissement actif de l'utilisateur connecté (ou null)."""
        Investment = __import__('api.models', fromlist=['Investment']).Investment
        inv = Investment.objects.filter(user=request.user, active=True).order_by('-created_at').first()
        if inv:
            return Response({
                'id': inv.id,
                'amount': str(inv.amount),
                'created_at': inv.created_at,
                'active': inv.active,
            })
        return Response({}, status=200)

    def list(self, request):
        invs = __import__('api.models', fromlist=['Investment']).Investment.objects.filter(user=request.user).order_by('-created_at')
        serializer = InvestmentSerializer(invs, many=True)
        return Response(serializer.data)

    def create(self, request):
        from decimal import Decimal, ROUND_DOWN
        from django.db import transaction
        data = request.data
        amount = data.get('amount')
        if amount is None:
            return Response({'message': 'amount required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amt = Decimal(str(amount))
        except Exception:
            return Response({'message': 'invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        if amt <= Decimal('0'):
            return Response({'message': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        # use the user's first wallet (frontend uses single wallet concept)
        w = Wallet.objects.filter(user=request.user).first()
        if not w:
            return Response({'message': 'wallet not found'}, status=status.HTTP_404_NOT_FOUND)


        offer_id = data.get('offer_id') or data.get('offer')
        market_offer = None
        daily = None
        contrat_duree = None
        if offer_id:
            try:
                market_offer = MarketOffer.objects.select_for_update().get(pk=int(offer_id))
                if market_offer.status != 'open':
                    return Response({'message': 'offer not available'}, status=status.HTTP_400_BAD_REQUEST)
                # Utiliser les paramètres de l'offre
                daily = market_offer.gains
                contrat_duree = market_offer.contrat_duree
            except MarketOffer.DoesNotExist:
                return Response({'message': 'offer not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=w.pk)
                if w.available < amt:
                    return Response({'message': 'insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
                w.available = (w.available - amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                # increment invested balance
                w.invested = (w.invested + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                w.sale_balance = (w.sale_balance + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                w.save()

                Investment = __import__('api.models', fromlist=['Investment']).Investment
                # Si pas d'offre, fallback sur VIP classique
                if not daily:
                    try:
                        vip_level = int(getattr(request.user.investor, 'vip_level', 0) or 0)
                    except Exception:
                        vip_level = 0
                    daily = (Decimal('0.025') * Decimal(vip_level)).quantize(Decimal('0.000001')) if vip_level > 0 else Decimal('0')

                inv = Investment.objects.create(
                    user=request.user,
                    wallet=w,
                    market_offer=market_offer,
                    amount=amt,
                    last_accrual=None,
                    daily_rate=daily
                )

                # Si offre du marché, la marquer comme acceptée
                if market_offer:
                    market_offer.status = 'accepted'
                    market_offer.expires_at = timezone.now()
                    market_offer.save()

                Transaction.objects.create(wallet=w, amount=amt, type='trade')
                try:
                    recompute_vip_for_user(request.user)
                except Exception:
                    pass

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InvestmentSerializer(inv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accrue(self, request, pk=None):
        """Accrue interest for a single investment (useful for testing/manual run)."""
        from decimal import Decimal, ROUND_DOWN
        from django.db import transaction
        from django.utils import timezone

        try:
            Investment = __import__('api.models', fromlist=['Investment']).Investment
            inv = Investment.objects.select_for_update().get(pk=pk, user=request.user)
        except Investment.DoesNotExist:
            return Response({'message': 'investment not found'}, status=status.HTTP_404_NOT_FOUND)

        if not inv.active:
            return Response({'message': 'investment not active'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        last = inv.last_accrual or inv.created_at
        # compute full days elapsed
        delta = now - last
        days = delta.days
        if days < 1:
            return Response({'message': 'no days elapsed since last accrual'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=inv.wallet.pk)
                daily = Decimal(str(inv.daily_rate))
                principal = Decimal(str(inv.amount))
                # simple interest for elapsed days
                interest = (principal * daily * Decimal(days)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                if interest > 0:
                    try:
                        w.gains = (w.gains + interest).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    except Exception:
                        w.gains = interest
                    w.save()
                    # record as a deposit-like transaction
                    Transaction.objects.create(wallet=w, amount=interest, type='deposit')

                inv.last_accrual = now
                inv.save()
        except Exception as e:
            logger.exception('accrue failed for inv %s user %s', pk, request.user)
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'interest': str(interest), 'new_gains': str(w.gains)})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def withdraw(self, request, pk=None):
        """Withdraw invested principal back to available after 30 days from creation."""
        from decimal import Decimal, ROUND_DOWN
        from django.db import transaction
        from django.utils import timezone

        try:
            Investment = __import__('api.models', fromlist=['Investment']).Investment
            inv = Investment.objects.select_for_update().get(pk=pk, user=request.user)
        except Investment.DoesNotExist:
            return Response({'message': 'investment not found'}, status=status.HTTP_404_NOT_FOUND)

        if not inv.active:
            return Response({'message': 'investment not active or already withdrawn'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        age = now - inv.created_at
        if age.days < 30:
            return Response({'message': 'funds locked for 30 days'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=inv.wallet.pk)
                principal = Decimal(str(inv.amount))
                if w.invested < principal:
                    return Response({'message': 'invested balance inconsistent'}, status=status.HTTP_400_BAD_REQUEST)

                w.invested = (w.invested - principal).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                w.available = (w.available + principal).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                w.save()

                # mark investment inactive
                inv.active = False
                inv.save()

                Transaction.objects.create(wallet=w, amount=principal, type='withdraw')
        except Exception as e:
            logger.exception('withdraw failed for inv %s user %s', pk, request.user)
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'withdrawn', 'amount': str(principal), 'wallet': WalletSerializer(w).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def encash(self, request, pk=None):
        """Encaisse les gains d'un investissement. Pour les offres du marché, seulement à la fin du contrat."""
        from decimal import Decimal, ROUND_DOWN
        from django.db import transaction
        from django.utils import timezone

        try:
            Investment = __import__('api.models', fromlist=['Investment']).Investment
            inv = Investment.objects.select_for_update().get(pk=pk, user=request.user)
        except Investment.DoesNotExist:
            return Response({'message': 'investment not found'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        last = inv.last_accrual or inv.created_at
        delta = now - last
        days = delta.days

        # Si lié à une offre du marché, gains réclamables uniquement à la fin du contrat
        if inv.market_offer:
            contrat_duree = inv.market_offer.contrat_duree or 0
            age_total = (now - inv.created_at).days
            if age_total < contrat_duree:
                return Response({'message': f'Gains réclamables uniquement à la fin du contrat ({contrat_duree} jours). Il reste {contrat_duree - age_total} jour(s).'}, status=status.HTTP_400_BAD_REQUEST)

        if days < 1:
            return Response({'message': 'no accrued days to encash'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=inv.wallet.pk)
                daily = Decimal(str(inv.daily_rate))
                principal = Decimal(str(inv.amount))
                # Pour les offres du marché, gains = daily * contrat_duree
                if inv.market_offer:
                    contrat_duree = inv.market_offer.contrat_duree or 0
                    interest = (principal * daily * Decimal(contrat_duree)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                else:
                    interest = (principal * daily * Decimal(days)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                if interest <= Decimal('0'):
                    return Response({'message': 'no interest to encash'}, status=status.HTTP_400_BAD_REQUEST)

                # créditer le solde disponible
                w.available = (w.available + interest).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                w.save()
                Transaction.objects.create(wallet=w, amount=interest, type='deposit')

                # update investment last_accrual et désactiver l'investissement si offre du marché
                inv.last_accrual = now
                if inv.market_offer:
                    inv.active = False
                inv.save()

        except Exception as e:
            logger.exception('encash failed for inv %s user %s', pk, request.user)
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'encashed', 'amount': str(interest), 'wallet': WalletSerializer(w).data})
        def last(self, request):
            """Retourne le dernier investissement actif de l'utilisateur connecté (ou null)."""
            Investment = __import__('api.models', fromlist=['Investment']).Investment
            inv = Investment.objects.filter(user=request.user, active=True).order_by('-created_at').first()
            if inv:
                return Response({
                    'id': inv.id,
                    'amount': str(inv.amount),
                    'created_at': inv.created_at,
                    'active': inv.active,
                })
            return Response({}, status=200)
    """Simple ViewSet to create/list investments and trigger accrual for a single investment."""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        invs = __import__('api.models', fromlist=['Investment']).Investment.objects.filter(user=request.user).order_by('-created_at')
        serializer = InvestmentSerializer(invs, many=True)
        return Response(serializer.data)

    def create(self, request):
        from decimal import Decimal, ROUND_DOWN
        from django.db import transaction
        data = request.data
        amount = data.get('amount')
        if amount is None:
            return Response({'message': 'amount required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amt = Decimal(str(amount))
        except Exception:
            return Response({'message': 'invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        if amt <= Decimal('0'):
            return Response({'message': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        # use the user's first wallet (frontend uses single wallet concept)
        w = Wallet.objects.filter(user=request.user).first()
        if not w:
            return Response({'message': 'wallet not found'}, status=status.HTTP_404_NOT_FOUND)

        offer_id = data.get('offer_id') or data.get('offer')

        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=w.pk)
                if w.available < amt:
                    return Response({'message': 'insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
                w.available = (w.available - amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                # increment invested balance
                try:
                    w.invested = (w.invested + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                except Exception:
                    w.invested = amt.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                # also keep sale_balance in sync for frontend that shows sale balance
                try:
                    w.sale_balance = (w.sale_balance + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                except Exception:
                    w.sale_balance = amt.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                w.save()

                Investment = __import__('api.models', fromlist=['Investment']).Investment
                # determine daily rate based on user's VIP level
                try:
                    vip_level = int(getattr(request.user.investor, 'vip_level', 0) or 0)
                except Exception:
                    vip_level = 0

                if vip_level <= 0:
                    daily = Decimal('0')
                else:
                    # 2.5% per VIP level (0.025 * vip_level)
                    daily = (Decimal('0.025') * Decimal(vip_level)).quantize(Decimal('0.000001'))

                inv = Investment.objects.create(user=request.user, wallet=w, amount=amt, last_accrual=None, daily_rate=daily)

                # If this investment is tied to a MarketOffer, mark the offer accepted
                if offer_id:
                    try:
                        mo = MarketOffer.objects.select_for_update().get(pk=int(offer_id))
                        if mo.status != 'open':
                            return Response({'message': 'offer not available'}, status=status.HTTP_400_BAD_REQUEST)
                        mo.status = 'accepted'
                        mo.expires_at = timezone.now()
                        mo.save()

                        # create a Trade record to record the acceptance
                        buyer_info = {'id': request.user.id, 'username': getattr(request.user, 'username', None)}
                        seller = mo.seller if mo.seller is not None else request.user
                        Trade.objects.create(
                            offer_id=str(mo.pk),
                            seller=seller,
                            amount=amt,
                            price=getattr(mo, 'price_offered', 0) or 0,
                            surplus=getattr(mo, 'surplus', 0) or 0,
                            buyer_info=buyer_info,
                        )
                    except MarketOffer.DoesNotExist:
                        return Response({'message': 'offer not found'}, status=status.HTTP_404_NOT_FOUND)

                # record transaction for the investment
                Transaction.objects.create(wallet=w, amount=amt, type='trade')
                # recompute VIP from current wallet invested sums (preferred behavior)
                try:
                    recompute_vip_for_user(request.user)
                except Exception:
                    # best-effort: do not break the investment flow on VIP recompute errors
                    pass

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InvestmentSerializer(inv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    class InvestmentViewSet(viewsets.ViewSet):
        """Simple ViewSet to create/list investments and trigger accrual for a single investment."""
        permission_classes = [IsAuthenticated]

        def list(self, request):
            invs = __import__('api.models', fromlist=['Investment']).Investment.objects.filter(user=request.user).order_by('-created_at')
            serializer = InvestmentSerializer(invs, many=True)
            return Response(serializer.data)

        def create(self, request):
            from decimal import Decimal, ROUND_DOWN
            from django.db import transaction
            data = request.data
            amount = data.get('amount')
            if amount is None:
                return Response({'message': 'amount required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                amt = Decimal(str(amount))
            except Exception:
                return Response({'message': 'invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

            if amt <= Decimal('0'):
                return Response({'message': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

            # use the user's first wallet (frontend uses single wallet concept)
            w = Wallet.objects.filter(user=request.user).first()
            if not w:
                return Response({'message': 'wallet not found'}, status=status.HTTP_404_NOT_FOUND)

            offer_id = data.get('offer_id') or data.get('offer')

            try:
                with transaction.atomic():
                    w = Wallet.objects.select_for_update().get(pk=w.pk)
                    if w.available < amt:
                        return Response({'message': 'insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
                    w.available = (w.available - amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    # increment invested balance
                    try:
                        w.invested = (w.invested + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    except Exception:
                        w.invested = amt.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    # also keep sale_balance in sync for frontend that shows sale balance
                    try:
                        w.sale_balance = (w.sale_balance + amt).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    except Exception:
                        w.sale_balance = amt.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    w.save()

                    Investment = __import__('api.models', fromlist=['Investment']).Investment
                    # determine daily rate based on user's VIP level
                    try:
                        vip_level = int(getattr(request.user.investor, 'vip_level', 0) or 0)
                    except Exception:
                        vip_level = 0

                    if vip_level <= 0:
                        daily = Decimal('0')
                    else:
                        # 2.5% per VIP level (0.025 * vip_level)
                        daily = (Decimal('0.025') * Decimal(vip_level)).quantize(Decimal('0.000001'))

                    inv = Investment.objects.create(user=request.user, wallet=w, amount=amt, last_accrual=None, daily_rate=daily)

                    # If this investment is tied to a MarketOffer, mark the offer accepted
                    if offer_id:
                        try:
                            mo = MarketOffer.objects.select_for_update().get(pk=int(offer_id))
                            if mo.status != 'open':
                                return Response({'message': 'offer not available'}, status=status.HTTP_400_BAD_REQUEST)
                            mo.status = 'accepted'
                            mo.expires_at = timezone.now()
                            mo.save()

                            # create a Trade record to record the acceptance
                            buyer_info = {'id': request.user.id, 'username': getattr(request.user, 'username', None)}
                            seller = mo.seller if mo.seller is not None else request.user
                            Trade.objects.create(
                                offer_id=str(mo.pk),
                                seller=seller,
                                amount=amt,
                                price=getattr(mo, 'price_offered', 0) or 0,
                                surplus=getattr(mo, 'surplus', 0) or 0,
                                buyer_info=buyer_info,
                            )
                        except MarketOffer.DoesNotExist:
                            return Response({'message': 'offer not found'}, status=status.HTTP_404_NOT_FOUND)

                    # record transaction for the investment
                    Transaction.objects.create(wallet=w, amount=amt, type='trade')
                    # recompute VIP from current wallet invested sums (preferred behavior)
                    try:
                        recompute_vip_for_user(request.user)
                    except Exception:
                        # best-effort: do not break the investment flow on VIP recompute errors
                        pass

            except Exception as e:
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            serializer = InvestmentSerializer(inv)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
        def accrue(self, request, pk=None):
            """Accrue interest for a single investment (useful for testing/manual run)."""
            from decimal import Decimal, ROUND_DOWN
            from django.db import transaction
            from django.utils import timezone

            try:
                Investment = __import__('api.models', fromlist=['Investment']).Investment
                inv = Investment.objects.select_for_update().get(pk=pk, user=request.user)
            except Investment.DoesNotExist:
                return Response({'message': 'investment not found'}, status=status.HTTP_404_NOT_FOUND)

            if not inv.active:
                return Response({'message': 'investment not active'}, status=status.HTTP_400_BAD_REQUEST)

            now = timezone.now()
            last = inv.last_accrual or inv.created_at
            # compute full days elapsed
            delta = now - last
            days = delta.days
            if days < 1:
                return Response({'message': 'no days elapsed since last accrual'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    w = Wallet.objects.select_for_update().get(pk=inv.wallet.pk)
                    daily = Decimal(str(inv.daily_rate))
                    principal = Decimal(str(inv.amount))
                    # simple interest for elapsed days
                    interest = (principal * daily * Decimal(days)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    if interest > 0:
                        try:
                            w.gains = (w.gains + interest).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                        except Exception:
                            w.gains = interest
                        w.save()
                        # record as a deposit-like transaction
                        Transaction.objects.create(wallet=w, amount=interest, type='deposit')

                    inv.last_accrual = now
                    inv.save()
            except Exception as e:
                logger.exception('accrue failed for inv %s user %s', pk, request.user)
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'interest': str(interest), 'new_gains': str(w.gains)})

        @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
        def withdraw(self, request, pk=None):
            """Withdraw invested principal back to available after 30 days from creation."""
            from decimal import Decimal, ROUND_DOWN
            from django.db import transaction
            from django.utils import timezone

            try:
                Investment = __import__('api.models', fromlist=['Investment']).Investment
                inv = Investment.objects.select_for_update().get(pk=pk, user=request.user)
            except Investment.DoesNotExist:
                return Response({'message': 'investment not found'}, status=status.HTTP_404_NOT_FOUND)

            if not inv.active:
                return Response({'message': 'investment not active or already withdrawn'}, status=status.HTTP_400_BAD_REQUEST)

            now = timezone.now()
            age = now - inv.created_at
            if age.days < 30:
                return Response({'message': 'funds locked for 30 days'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    w = Wallet.objects.select_for_update().get(pk=inv.wallet.pk)
                    principal = Decimal(str(inv.amount))
                    if w.invested < principal:
                        return Response({'message': 'invested balance inconsistent'}, status=status.HTTP_400_BAD_REQUEST)

                    w.invested = (w.invested - principal).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    w.available = (w.available + principal).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    w.save()

                    # mark investment inactive
                    inv.active = False
                    inv.save()

                    Transaction.objects.create(wallet=w, amount=principal, type='withdraw')
            except Exception as e:
                logger.exception('withdraw failed for inv %s user %s', pk, request.user)
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'message': 'withdrawn', 'amount': str(principal), 'wallet': WalletSerializer(w).data})

        @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
        def encash(self, request, pk=None):
            """Encash accrued interest for a single investment and move it to available."""
            from decimal import Decimal, ROUND_DOWN
            from django.db import transaction
            from django.utils import timezone

            try:
                Investment = __import__('api.models', fromlist=['Investment']).Investment
                inv = Investment.objects.select_for_update().get(pk=pk, user=request.user)
            except Investment.DoesNotExist:
                return Response({'message': 'investment not found'}, status=status.HTTP_404_NOT_FOUND)

            now = timezone.now()
            last = inv.last_accrual or inv.created_at
            delta = now - last
            days = delta.days
            if days < 1:
                return Response({'message': 'no accrued days to encash'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    w = Wallet.objects.select_for_update().get(pk=inv.wallet.pk)
                    daily = Decimal(str(inv.daily_rate))
                    principal = Decimal(str(inv.amount))
                    interest = (principal * daily * Decimal(days)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    if interest <= Decimal('0'):
                        return Response({'message': 'no interest to encash'}, status=status.HTTP_400_BAD_REQUEST)

                    # credit available directly (encash to available balance)
                    try:
                        w.available = (w.available + interest).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
                    except Exception:
                        w.available = interest
                    w.save()

                    # record transaction
                    Transaction.objects.create(wallet=w, amount=interest, type='deposit')

                    # update investment last_accrual
                    inv.last_accrual = now
                    inv.save()

            except Exception as e:
                logger.exception('encash failed for inv %s user %s', pk, request.user)
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'message': 'encashed', 'amount': str(interest), 'wallet': WalletSerializer(w).data})

        @action(detail=False, methods=['get'], url_path='last', permission_classes=[IsAuthenticated])
        def last(self, request):
            """Retourne le dernier investissement actif de l'utilisateur connecté (ou null)."""
            Investment = __import__('api.models', fromlist=['Investment']).Investment
            inv = Investment.objects.filter(user=request.user, active=True).order_by('-created_at').first()
            if inv:
                return Response({
                    'id': inv.id,
                    'amount': str(inv.amount),
                    'created_at': inv.created_at,
                    'active': inv.active,
                })
            return Response({}, status=200)

    def get_queryset(self):
        """Return only active crypto addresses."""
        return CryptoAddress.objects.filter(is_active=True)


class SocialLinksViewSet(viewsets.ReadOnlyModelViewSet):
    """Retrieve social media links (WhatsApp and Telegram)."""
    queryset = SocialLinks.objects.all()
    serializer_class = SocialLinksSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        """Return the single instance of social links."""
        instance = SocialLinks.objects.first()
        if instance:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({
            'whatsapp_channel': None,
            'whatsapp_group': None,
            'telegram_channel': None,
            'telegram_group': None
        })


class AboutPageViewSet(viewsets.ModelViewSet):
    """Retrieve and manage the About page content."""
    queryset = AboutPage.objects.all()
    serializer_class = AboutPageSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def list(self, request, *args, **kwargs):
        instance = AboutPage.objects.first()
        if instance is None:
            instance = AboutPage.objects.create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class UserBankAccountViewSet(viewsets.ModelViewSet):
    """Manage user bank accounts and crypto accounts."""
    serializer_class = UserBankAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserBankAccount.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        is_default = serializer.validated_data.get('is_default')
        if is_default is None:
            has_any = UserBankAccount.objects.filter(user=self.request.user).exists()
            if not has_any:
                serializer.validated_data['is_default'] = True
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        account = self.get_object()
        UserBankAccount.objects.filter(user=request.user, is_default=True).update(is_default=False)
        account.is_default = True
        account.save()
        return Response({'status': 'Compte défini comme défaut'})


class UserVIPSubscriptionsView(APIView):
    """Get user's VIP subscriptions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscriptions = UserVIPSubscription.objects.filter(user=request.user).order_by('-active', 'vip_level__level')
        serializer = UserVIPSubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """Support tickets for async chat."""
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self.request.user, 'is_staff', False):
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='open')

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        if request.method == 'GET':
            msgs = SupportMessage.objects.filter(ticket=ticket).order_by('created_at')
            return Response(SupportMessageSerializer(msgs, many=True).data)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'message': 'message requis'}, status=status.HTTP_400_BAD_REQUEST)

        sender_role = 'admin' if request.user.is_staff else 'user'
        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_role=sender_role,
            content=content
        )

        # Update ticket status based on sender
        if sender_role == 'admin' and ticket.status == 'open':
            ticket.status = 'in_progress'
            ticket.save(update_fields=['status', 'updated_at'])
        if sender_role == 'user' and ticket.status == 'resolved':
            ticket.status = 'open'
            ticket.save(update_fields=['status', 'updated_at'])

        return Response(SupportMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        status_value = request.data.get('status')
        if status_value not in dict(SupportTicket.STATUS_CHOICES):
            return Response({'message': 'statut invalide'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = status_value
        ticket.save(update_fields=['status', 'updated_at'])
        return Response(SupportTicketSerializer(ticket).data)


class PurchaseVIPLevelView(APIView):
    """Purchase a VIP level."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from datetime import timedelta
        from django.utils import timezone as _tz
        from decimal import Decimal
        level_id = request.data.get('level_id')
        if not level_id:
            return Response({'message': 'level_id requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vip_level = VIPLevel.objects.get(id=level_id)
        except VIPLevel.DoesNotExist:
            return Response({'message': 'Niveau VIP non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Check if user already purchased this level
        if UserVIPSubscription.objects.filter(user=request.user, vip_level=vip_level, active=True).exists():
            return Response({'message': 'Vous avez déjà acheté ce niveau'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create wallet
        wallet = Wallet.objects.filter(user=request.user).first()
        if not wallet:
            return Response({'message': 'Portefeuille non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Trouver le VIP actif le plus élevé déjà acheté
        previous_sub = UserVIPSubscription.objects.filter(user=request.user, active=True).select_related('vip_level').order_by('-vip_level__level').first()
        previous_price = Decimal('0')
        if previous_sub:
            previous_price = previous_sub.vip_level.price

        # Calculer la différence à payer (sans remboursement)
        to_pay = vip_level.price - previous_price
        if to_pay <= 0:
            return Response({'message': 'Aucun paiement requis ou niveau déjà atteint'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que le solde principal permet de payer la différence
        if wallet.available < to_pay:
            return Response({'message': 'Solde insuffisant pour la mise à niveau', 'missing': float(to_pay - wallet.available)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db import transaction as db_transaction
            with db_transaction.atomic():
                # Désactiver les anciens abonnements VIP
                UserVIPSubscription.objects.filter(user=request.user, active=True).update(active=False)

                # Débiter uniquement la différence à payer
                wallet.available = (wallet.available - to_pay).quantize(Decimal('0.01'))
                # Le solde investi doit refléter le montant total du nouveau VIP
                wallet.invested = vip_level.price
                try:
                    wallet.sale_balance = (wallet.sale_balance + to_pay)
                except Exception:
                    wallet.sale_balance = to_pay
                wallet.save()

                # Créer la transaction
                Transaction.objects.create(
                    wallet=wallet,
                    amount=to_pay,
                    type='transfer'
                )

                # Créer la nouvelle souscription VIP (contrat 180 jours)
                contract_start = _tz.now()
                contract_end = contract_start + timedelta(days=180)
                subscription = UserVIPSubscription.objects.create(
                    user=request.user,
                    vip_level=vip_level,
                    contract_start=contract_start,
                    contract_end=contract_end,
                    active=True
                )

            serializer = UserVIPSubscriptionSerializer(subscription)
            return Response({'message': 'Niveau VIP acheté avec succès', 'subscription': serializer.data})
        except Exception as e:
            logger.error(f'Error purchasing VIP level: {e}')
            return Response({'message': 'Erreur lors de l\'achat'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuantificationGainsView(APIView):
    """Get user's daily gains from VIP levels and investments."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vip_gains = {}
        investment_gains = {}

        # Calculate VIP gains: only highest active level counts
        subscriptions = UserVIPSubscription.objects.filter(user=request.user, active=True)
        highest_level = subscriptions.aggregate(max_level=Max('vip_level__level')).get('max_level')
        if highest_level:
            highest_sub = subscriptions.filter(vip_level__level=highest_level).select_related('vip_level').first()
            if highest_sub:
                vip_gains[f"VIP_Level_{highest_sub.vip_level.level}"] = float(highest_sub.vip_level.daily_gains)

        # Calculate investment gains: available only after 24 hours from creation
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(hours=24)
        investments = Investment.objects.filter(user=request.user, active=True, created_at__lte=cutoff)
        total_investment_gains = 0
        for inv in investments:
            daily = float(inv.amount * inv.daily_rate)
            total_investment_gains += daily

        investment_gains['total'] = total_investment_gains

        return Response({
            'vip_gains': vip_gains,
            'investment_gains': investment_gains,
            'total_gains': sum(vip_gains.values()) + total_investment_gains
        })


class ClaimGainsView(APIView):
    """Claim all daily gains."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from django.db import transaction as db_transaction
            from decimal import Decimal

            with db_transaction.atomic():
                wallet = Wallet.objects.select_for_update().filter(user=request.user).first()
                if not wallet:
                    return Response({'message': 'Portefeuille non trouvé'}, status=status.HTTP_404_NOT_FOUND)

                # Collect VIP gains: only highest active level counts
                vip_gains = Decimal('0')
                subscriptions = UserVIPSubscription.objects.filter(user=request.user, active=True)
                highest_level = subscriptions.aggregate(max_level=Max('vip_level__level')).get('max_level')
                if highest_level:
                    highest_sub = subscriptions.filter(vip_level__level=highest_level).select_related('vip_level').first()
                    if highest_sub:
                        vip_gains += highest_sub.vip_level.daily_gains

                # Collect investment gains: available only after 24 hours from creation
                from datetime import timedelta
                cutoff = timezone.now() - timedelta(hours=24)
                investment_gains = Decimal('0')
                investments = Investment.objects.filter(user=request.user, active=True, created_at__lte=cutoff)
                for inv in investments:
                    daily = inv.amount * inv.daily_rate
                    investment_gains += daily

                total_gains = vip_gains + investment_gains

                if total_gains > 0:
                    wallet.gains = (wallet.gains + total_gains).quantize(Decimal('0.01'))
                    wallet.save()

                    # Create transaction record
                    Transaction.objects.create(
                        wallet=wallet,
                        amount=total_gains,
                        type='encash'
                    )

                    return Response({
                        'message': 'Gains encaissés avec succès',
                        'amount': float(total_gains),
                        'vip_gains': float(vip_gains),
                        'investment_gains': float(investment_gains)
                    })
                else:
                    return Response({'message': 'Aucun gain disponible'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f'Error claiming gains: {e}')
            return Response({'message': 'Erreur lors de l\'encaissement'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WithdrawalViewSet(viewsets.ModelViewSet):
    """Manage withdrawal requests."""
    serializer_class = WithdrawalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Les utilisateurs voient leurs propres retraits
        # Les admins voient tous les retraits
        if self.request.user.is_staff:
            return Withdrawal.objects.all().order_by('-created_at')
        return Withdrawal.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        """Créer une demande de retrait et notifier les admins."""
        withdrawal = serializer.save(user=self.request.user)
        
        # Créer des notifications admin pour tous les admins
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        for admin in admin_users:
            AdminNotification.objects.create(
                admin=admin,
                user=self.request.user,
                notification_type='withdrawal',
                amount=withdrawal.amount,
                account_info=f"{withdrawal.bank} - {withdrawal.account}",
                withdrawal=withdrawal,
                is_read=False
            )

    def create(self, request):
        """Créer une demande de retrait."""
        amount = request.data.get('amount')
        bank = request.data.get('bank')
        account = request.data.get('account')
        
        if not all([amount, bank, account]):
            return Response(
                {'message': 'amount, bank, and account are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            withdrawal = Withdrawal.objects.create(
                user=request.user,
                amount=amount,
                bank=bank,
                account=account,
                status='pending'
            )
            
            # Créer des notifications admin
            admin_users = User.objects.filter(is_staff=True, is_active=True)
            for admin in admin_users:
                AdminNotification.objects.create(
                    admin=admin,
                    user=self.request.user,
                    notification_type='withdrawal',
                    amount=withdrawal.amount,
                    account_info=f"{withdrawal.bank} - {withdrawal.account}",
                    withdrawal=withdrawal,
                    is_read=False
                )
            
            return Response({
                'withdrawal_id': withdrawal.id,
                'status': withdrawal.status,
                'amount': float(withdrawal.amount),
                'message': 'Demande de retrait créée avec succès'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def process(self, request, pk=None):
        """Admin process a withdrawal request."""
        if not request.user.is_staff:
            return Response({'error': 'Permissions denied'}, status=status.HTTP_403_FORBIDDEN)
        
        withdrawal = self.get_object()
        action_type = request.data.get('action')  # 'complete' or 'reject'
        reason = request.data.get('reason', '')

        if action_type == 'complete':
            withdrawal.status = 'completed'
            withdrawal.processed_by = request.user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()
            return Response({'message': 'Retrait complété'})
        
        elif action_type == 'reject':
            if not reason:
                return Response({'error': 'Raison requise'}, status=status.HTTP_400_BAD_REQUEST)
            withdrawal.status = 'rejected'
            withdrawal.reason_rejected = reason
            withdrawal.processed_by = request.user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()
            return Response({'message': 'Retrait rejeté'})
        
        else:
            return Response({'error': 'Action invalide'}, status=status.HTTP_400_BAD_REQUEST)


class AdminNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin notifications for deposits and withdrawals."""
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return AdminNotification.objects.filter(admin=self.request.user)
        return AdminNotification.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read."""
        notification = self.get_object()
        if notification.admin != request.user:
            return Response({'error': 'Permissions denied'}, status=status.HTTP_403_FORBIDDEN)
        
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marquée comme lue'})

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_all_as_read(self, request):
        """Mark all notifications as read."""
        AdminNotification.objects.filter(admin=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'Toutes les notifications marquées comme lues'})
