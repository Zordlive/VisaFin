"""
AdminSite personnalisé pour VISAFINANCE
"""
from django.contrib import admin
from django.template.response import TemplateResponse


class CustomAdminSite(admin.AdminSite):
    """
    AdminSite personnalisé pour afficher les actions récentes des utilisateurs
    et les statistiques dans le tableau de bord.
    """
    site_header = "VISAFINANCE - Administration"
    site_title = "VISAFINANCE Admin"
    index_title = "Tableau de bord"
    
    def index(self, request, extra_context=None):
        """
        Page d'accueil de l'admin avec widgets personnalisés.
        """
        # Import ici pour éviter les imports circulaires
        from .admin_dashboard import get_user_recent_actions, get_dashboard_statistics, get_pending_actions_count
        
        extra_context = extra_context or {}
        
        # Récupérer les actions récentes des utilisateurs
        extra_context['user_recent_actions'] = get_user_recent_actions(limit=20)
        
        # Récupérer les statistiques du tableau de bord
        extra_context['dashboard_stats'] = get_dashboard_statistics()
        
        # Récupérer les actions en attente
        extra_context['pending_actions'] = get_pending_actions_count()
        
        # Utiliser le template personnalisé
        request.current_app = self.name
        return TemplateResponse(request, 'admin/custom_index.html', extra_context)


# Créer une instance de notre AdminSite personnalisé
admin_site = CustomAdminSite(name='customadmin')
