#!/bin/bash
# Script de vérification rapide du système crypto
# Usage: bash crypto_check.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        VÉRIFICATION DU SYSTÈME D'ADRESSES CRYPTO              ║"
echo "║                    VISAFINANCE 2026                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend en cours d'exécution
echo "🔍 Test 1: Backend Django..."
if curl -s http://localhost:8000/api/crypto-addresses/ > /dev/null; then
    echo -e "${GREEN}✅ Backend réactif${NC}"
else
    echo -e "${RED}❌ Backend inaccessible${NC}"
    echo "   → Lancez: cd backend && python manage.py runserver"
fi
echo ""

# Test 2: API endpoint
echo "🔍 Test 2: API endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/crypto-addresses/)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint fonctionnel (HTTP 200)${NC}"
    COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo "   → $COUNT adresse(s) trouvée(s)"
else
    echo -e "${RED}❌ Endpoint en erreur (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: Frontend
echo "🔍 Test 3: Frontend React..."
if curl -s http://localhost:5173/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend inaccessible${NC}"
    echo "   → Lancez: cd frontend && npm run dev"
fi
echo ""

# Test 4: Base de données
echo "🔍 Test 4: Base de données..."
cd backend
RESULT=$(python -c "
from api.models import CryptoAddress
count = CryptoAddress.objects.count()
active = CryptoAddress.objects.filter(is_active=True).count()
print(f'total={count},active={active}')
" 2>/dev/null)

if [ ! -z "$RESULT" ]; then
    echo -e "${GREEN}✅ Base de données accessible${NC}"
    echo "   → Total: $(echo $RESULT | cut -d'=' -f2 | cut -d',' -f1) adresses"
    echo "   → Actives: $(echo $RESULT | cut -d'=' -f3) adresses"
else
    echo -e "${RED}❌ Erreur BD${NC}"
fi
cd ..
echo ""

# Test 5: Admin
echo "🔍 Test 5: Interface Admin..."
if curl -s http://localhost:8000/admin/ | grep -q "Django"; then
    echo -e "${GREEN}✅ Admin Django accessible${NC}"
    echo "   → Accédez à: http://localhost:8000/admin/"
else
    echo -e "${YELLOW}⚠️  Admin inaccessible${NC}"
fi
echo ""

# Résumé
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     PROCHAINES ÉTAPES                         ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║ 1. ✅ Enregistrer les adresses:                               ║"
echo "║    → http://localhost:8000/admin/api/cryptoaddress/          ║"
echo "║    → Cliquez: + Ajouter adresse crypto                       ║"
echo "║                                                                ║"
echo "║ 2. 📋 Remplir les champs:                                     ║"
echo "║    • Réseau: TRC-20 (USDT) / BEP-20 (USDT) / BNB             ║"
echo "║    • Adresse: votre adresse crypto                            ║"
echo "║    • Actif: cochez la case                                   ║"
echo "║                                                                ║"
echo "║ 3. ✅ Vérifier l'affichage:                                   ║"
echo "║    → http://localhost:5173/dashboard                         ║"
echo "║    → Dépôt > Onglet Crypto                                   ║"
echo "║    → Vérifiez que l'adresse s'affiche                       ║"
echo "║                                                                ║"
echo "║ 4. 🧪 Lancer les tests:                                      ║"
echo "║    → cd backend && python test_crypto_addresses.py           ║"
echo "║                                                                ║"
echo "║ 5. 📚 Documentation:                                          ║"
echo "║    • CRYPTO_SETUP.md - Pour admin                            ║"
echo "║    • CRYPTO_DEPOSIT_GUIDE.md - Pour users                    ║"
echo "║    • CRYPTO_ARCHITECTURE.md - Pour devs                      ║"
echo "║    • README_CRYPTO.md - Vue d'ensemble                       ║"
echo "║    • CRYPTO_FLOW_DIAGRAM.txt - Diagrammes                    ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "💡 Besoin d'aide? Consultez la documentation ou lancez:"
echo "   python backend/test_crypto_addresses.py"
echo ""
