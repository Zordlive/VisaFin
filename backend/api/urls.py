from django.urls import path, include
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'wallets', views.WalletViewSet, basename='wallet')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'vip-levels', views.VIPLevelViewSet, basename='vip-level')
router.register(r'operateurs', views.OperateurViewSet, basename='operateur')
router.register(r'bank-accounts', views.UserBankAccountViewSet, basename='bank-account')
router.register(r'withdrawals', views.WithdrawalViewSet, basename='withdrawal')
router.register(r'admin-notifications', views.AdminNotificationViewSet, basename='admin-notification')
router.register(r'crypto-addresses', views.CryptoAddressViewSet, basename='crypto-address')
router.register(r'social-links', views.SocialLinksViewSet, basename='social-links')

urlpatterns = [
    path('', include(router.urls)),

    path('csrf/', views.csrf, name='csrf'),


    # market endpoints matching frontend expectations
    path('market/offers', views.MarketOfferViewSet.as_view({'get': 'list'}), name='market-offers-list'),
    path('market/offers/<int:pk>', views.MarketOfferViewSet.as_view({'get': 'retrieve'}), name='market-offers-detail'),
    # virtual buyer endpoints removed
    path('referrals/me', views.ReferralsMeView.as_view(), name='referrals-me'),
    path('referrals/all/', views.AdminReferralsView.as_view(), name='referrals-all'),
    # investments
    path('investments', views.InvestmentViewSet.as_view({'get': 'list', 'post': 'create'}), name='investments-list'),
    path('investments/<int:pk>/accrue', views.InvestmentViewSet.as_view({'post': 'accrue'}), name='investments-accrue'),
    path('investments/<int:pk>/encash', views.InvestmentViewSet.as_view({'post': 'encash'}), name='investments-encash'),

    # VIP subscriptions
    path('vip-subscriptions/me', views.UserVIPSubscriptionsView.as_view(), name='vip-subscriptions-me'),
    path('vip-subscriptions/purchase', views.PurchaseVIPLevelView.as_view(), name='vip-purchase'),
    path('quantification/gains', views.QuantificationGainsView.as_view(), name='quantification-gains'),
    path('quantification/claim', views.ClaimGainsView.as_view(), name='quantification-claim'),

    # deposits
    path('deposits/initiate', views.DepositViewSet.as_view({'post': 'initiate'}), name='deposits-initiate'),
    path('deposits/<int:pk>/status', views.DepositViewSet.as_view({'get': 'status'}), name='deposits-status'),

    # auth endpoints expected by frontend (they are under /api/auth/... because api base is /api)
    path('auth/login', views.LoginView.as_view(), name='auth-login'),
    path('auth/register', views.RegisterView.as_view(), name='auth-register'),
    path('auth/google', views.GoogleLoginView.as_view(), name='auth-google'),
    path('auth/google/', views.GoogleLoginView.as_view(), name='auth-google-slash'),
    path('auth/google-login', views.GoogleLoginView.as_view(), name='auth-google-login'),
    path('auth/refresh', views.RefreshTokenFromCookieView.as_view(), name='auth-refresh'),
    path('auth/logout', views.LogoutView.as_view(), name='auth-logout'),
    path('auth/test-login', views.TestLoginView.as_view(), name='auth-test-login'),
    path('me', views.MeView.as_view(), name='me'),
    path('user', views.UserUpdateView.as_view(), name='user-update'),
    # admin recompute VIP endpoint removed
    path('auth/register-email/', views.RegisterEmailView.as_view(), name='auth-register-email'),
    path('auth/verify-email/<uidb64>/<token>/', views.VerifyEmailView.as_view(), name='auth-verify-email'),
    path('auth/set-password/', views.SetPasswordView.as_view(), name='auth-set-password'),
]

