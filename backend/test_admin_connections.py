"""
Script de test pour vérifier que toutes les connexions admin sont fonctionnelles.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'invest_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Deposit, Withdrawal, AdminNotification, CryptoAddress, Investor
from api.admin_dashboard import get_user_recent_actions, get_dashboard_statistics, get_pending_actions_count
from api.admin_site import admin_site

print("=" * 80)
print("✅ TEST CONNEXIONS ADMIN DASHBOARD")
print("=" * 80)

# Test 1: Vérifier que admin_site est correctement configuré
print("\n1️⃣  Vérification de admin_site...")
try:
    assert admin_site is not None, "admin_site est None"
    assert admin_site.site_header == "VISAFINANCE - Administration", f"Site header incorrect: {admin_site.site_header}"
    print("   ✅ admin_site correctement configuré")
    print(f"   - Site header: {admin_site.site_header}")
    print(f"   - Site title: {admin_site.site_title}")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 2: Vérifier que les modèles sont enregistrés
print("\n2️⃣  Vérification des modèles enregistrés...")
try:
    registered_models = list(admin_site._registry.keys())
    print(f"   ✅ {len(registered_models)} modèles enregistrés:")
    for model in registered_models:
        print(f"      • {model.__name__}")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 3: Vérifier get_dashboard_statistics
print("\n3️⃣  Vérification de get_dashboard_statistics()...")
try:
    stats = get_dashboard_statistics()
    assert isinstance(stats, dict), f"get_dashboard_statistics doit retourner un dict, got {type(stats)}"
    print("   ✅ Statistiques disponibles:")
    for key, value in stats.items():
        print(f"      • {key}: {value}")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 4: Vérifier get_user_recent_actions
print("\n4️⃣  Vérification de get_user_recent_actions()...")
try:
    actions = get_user_recent_actions(limit=10)
    assert isinstance(actions, list), f"get_user_recent_actions doit retourner une list, got {type(actions)}"
    print(f"   ✅ {len(actions)} actions récentes disponibles")
    if actions:
        action = actions[0]
        required_keys = ['timestamp', 'user_id', 'user_name', 'action_type', 'status']
        for key in required_keys:
            assert key in action, f"Clé manquante: {key}"
        print(f"      • Exemple: {action['action_type']} de {action['user_name']} - Statut: {action['status']}")
    else:
        print("      (Aucune action disponible, c'est normal)")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 5: Vérifier get_pending_actions_count
print("\n5️⃣  Vérification de get_pending_actions_count()...")
try:
    pending = get_pending_actions_count()
    assert isinstance(pending, dict), f"get_pending_actions_count doit retourner un dict, got {type(pending)}"
    print("   ✅ Actions en attente:")
    for key, value in pending.items():
        print(f"      • {key}: {value}")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 6: Vérifier la base de données
print("\n6️⃣  Vérification de la base de données...")
try:
    users_count = User.objects.count()
    deposits_count = Deposit.objects.count()
    withdrawals_count = Withdrawal.objects.count()
    crypto_addresses_count = CryptoAddress.objects.count()
    
    print("   ✅ Données présentes:")
    print(f"      • Utilisateurs: {users_count}")
    print(f"      • Dépôts: {deposits_count}")
    print(f"      • Retraits: {withdrawals_count}")
    print(f"      • Adresses crypto: {crypto_addresses_count}")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 7: Vérifier les templates
print("\n7️⃣  Vérification des templates...")
try:
    from django.template.loader import get_template
    
    template_files = [
        'admin/custom_index.html',
        'admin/user_recent_actions.html',
    ]
    
    for template_file in template_files:
        try:
            template = get_template(template_file)
            print(f"   ✅ {template_file} trouvé")
        except Exception as e:
            print(f"   ❌ {template_file} NOT FOUND: {e}")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

# Test 8: Vérifier les URLs
print("\n8️⃣  Vérification des URLs admin...")
try:
    from django.urls import reverse, NoReverseMatch
    
    url_names = [
        'admin:index',
        'admin:auth_user_changelist',
        'admin:api_deposit_changelist',
        'admin:api_withdrawal_changelist',
    ]
    
    for url_name in url_names:
        try:
            url = reverse(url_name, urlconf='invest_backend.urls')
            print(f"   ✅ {url_name}: {url}")
        except NoReverseMatch:
            print(f"   ⚠️  {url_name}: URL non trouvée")
except Exception as e:
    print(f"   ❌ ERREUR: {e}")

print("\n" + "=" * 80)
print("✅ TEST TERMINÉ")
print("=" * 80)
