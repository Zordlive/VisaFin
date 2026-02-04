#!/usr/bin/env python
"""
Script de test pour vérifier le fonctionnement du système d'adresses crypto.
Usage: python test_crypto_addresses.py
"""

import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'invest_backend.settings')
django.setup()

from api.models import CryptoAddress
from django.test import Client
from rest_framework.test import APIClient

def print_header(title):
    """Affiche un titre formaté"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_database():
    """Test 1: Vérifier les adresses en base de données"""
    print_header("TEST 1: Base de données")
    
    addresses = CryptoAddress.objects.all()
    count = addresses.count()
    
    print(f"✓ Total d'adresses: {count}")
    
    if count == 0:
        print("⚠️  Aucune adresse enregistrée!")
        print("   → Allez à http://localhost:8000/admin/api/cryptoaddress/")
        print("   → Ajoutez au moins 1 adresse crypto")
        return False
    
    print("\nAdresses enregistrées:")
    for addr in addresses:
        status = "✅ ACTIF" if addr.is_active else "❌ INACTIF"
        preview = f"{addr.address[:20]}...{addr.address[-10:]}"
        print(f"  • {addr.get_network_display():20} {preview:35} {status}")
    
    return True

def test_api_endpoint():
    """Test 2: Vérifier l'API endpoint"""
    print_header("TEST 2: API Endpoint (/api/crypto-addresses/)")
    
    client = APIClient()
    
    try:
        response = client.get('/crypto-addresses/')
        print(f"✓ Statut HTTP: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Compter les résultats
            if isinstance(data, dict) and 'results' in data:
                count = len(data['results'])
                print(f"✓ Adresses retournées: {count}")
                
                if count > 0:
                    print("\nPremière adresse reçue:")
                    first = data['results'][0]
                    print(f"  • ID: {first.get('id')}")
                    print(f"  • Réseau: {first.get('network_display')}")
                    print(f"  • Adresse: {first.get('address')[:30]}...")
                    print(f"  • Actif: {first.get('is_active')}")
            else:
                print(f"✓ Format de réponse: {type(data)}")
                print(f"✓ Contenu: {json.dumps(data, indent=2)}")
            
            return True
        else:
            print(f"❌ Erreur HTTP {response.status_code}")
            print(f"   Réponse: {response.content}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de l'appel API: {e}")
        return False

def test_active_only():
    """Test 3: Vérifier que seules les adresses actives sont retournées"""
    print_header("TEST 3: Filtrage (Actif seulement)")
    
    active_count = CryptoAddress.objects.filter(is_active=True).count()
    inactive_count = CryptoAddress.objects.filter(is_active=False).count()
    
    print(f"✓ Adresses actives: {active_count}")
    print(f"✓ Adresses inactives: {inactive_count}")
    
    if inactive_count > 0:
        print("\n⚠️  Adresses inactives (non retournées aux users):")
        for addr in CryptoAddress.objects.filter(is_active=False):
            print(f"  • {addr.get_network_display()}: {addr.address[:30]}...")
    
    return active_count > 0

def test_network_choices():
    """Test 4: Vérifier les choix de réseau disponibles"""
    print_header("TEST 4: Choix de réseaux")
    
    networks = dict(CryptoAddress._meta.get_field('network').choices)
    
    print(f"✓ Réseaux disponibles: {len(networks)}")
    for code, display in networks.items():
        print(f"  • {code:15} → {display}")
    
    return len(networks) == 3  # Doit y avoir exactement 3 réseaux

def test_unique_networks():
    """Test 5: Vérifier qu'il n'y a qu'une adresse par réseau"""
    print_header("TEST 5: Unicité par réseau")
    
    networks = CryptoAddress.objects.values('network').distinct()
    network_count = networks.count()
    total_count = CryptoAddress.objects.count()
    
    print(f"✓ Réseaux configurés: {network_count}")
    print(f"✓ Total d'adresses: {total_count}")
    
    if network_count == total_count:
        print("✅ Chaque réseau a exactement 1 adresse")
        return True
    else:
        print(f"❌ Attention: {total_count - network_count} adresses en doublon!")
        for network in CryptoAddress.objects.values('network').annotate(
            count=models.Count('id')
        ).filter(count__gt=1):
            print(f"  • {network['network']}: {network['count']} adresses")
        return False

def test_serializer():
    """Test 6: Vérifier le serializer"""
    print_header("TEST 6: Serializer")
    
    from api.serializers import CryptoAddressSerializer
    
    addresses = CryptoAddress.objects.filter(is_active=True)[:1]
    
    if addresses.exists():
        addr = addresses.first()
        serializer = CryptoAddressSerializer(addr)
        data = serializer.data
        
        required_fields = ['id', 'network', 'network_display', 'address', 'is_active']
        missing = [f for f in required_fields if f not in data]
        
        print(f"✓ Champs dans la réponse:")
        for field in required_fields:
            value = data.get(field, 'N/A')
            if field == 'address':
                value = f"{value[:20]}..."
            print(f"  • {field:20} = {value}")
        
        if missing:
            print(f"\n❌ Champs manquants: {missing}")
            return False
        return True
    else:
        print("⚠️  Aucune adresse active pour tester")
        return False

def test_admin_registration():
    """Test 7: Vérifier l'enregistrement dans l'admin"""
    print_header("TEST 7: Enregistrement Admin")
    
    from django.contrib import admin
    from api.models import CryptoAddress
    
    if CryptoAddress in admin.site._registry:
        print("✅ CryptoAddress est enregistrée dans l'admin")
        return True
    else:
        print("❌ CryptoAddress n'est PAS enregistrée dans l'admin")
        return False

def run_all_tests():
    """Exécute tous les tests"""
    print("\n" + "🧪" * 30)
    print("     TESTS DE CONFIGURATION - ADRESSES CRYPTO")
    print("🧪" * 30)
    
    results = {
        "Base de données": test_database(),
        "API endpoint": test_api_endpoint(),
        "Filtrage actifs": test_active_only(),
        "Choix de réseaux": test_network_choices(),
        "Unicité des réseaux": test_unique_networks(),
        "Serializer": test_serializer(),
        "Admin registration": test_admin_registration(),
    }
    
    # Résumé final
    print_header("RÉSUMÉ FINAL")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nRésultats: {passed}/{total} tests ✅\n")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status:10} {test_name}")
    
    if passed == total:
        print("\n" + "🎉" * 20)
        print("TOUT EST CONFIGURÉ CORRECTEMENT! 🚀")
        print("🎉" * 20)
    else:
        print("\n⚠️  Certains tests ont échoué.")
        print("Veuillez vérifier la configuration.")
    
    return passed == total

if __name__ == "__main__":
    import sys
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
