from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from api.admin_site import admin_site  # Import notre AdminSite personnalisé

urlpatterns = [
    path('admin/', admin_site.urls),  # Utilise admin_site au lieu de admin.site
    # serve a simple favicon during development
    path('favicon.ico', RedirectView.as_view(url='/static/favicon.svg')),
    path('api/', include('api.urls')),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Custom error handlers
# Use the standard 404 page (status=404) to render a structured page for missing routes.
handler404 = 'invest_backend.views.custom_404_standard'
