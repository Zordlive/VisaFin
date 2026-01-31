# 🔐 Système de Gestion des Adresses Crypto - Documentation Complète

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Guide administrateur](#guide-administrateur)
4. [Guide utilisateur](#guide-utilisateur)
5. [Tests et vérification](#tests-et-vérification)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le système permet à l'**administrateur** d'enregistrer les adresses crypto de réception et aux **utilisateurs** de voir ces adresses pour effectuer des dépôts.

### Réseaux supportés

```
┌──────────────────┬─────────────────────┬──────────────────────┐
│ Code             │ Affichage           │ Symbole              │
├──────────────────┼─────────────────────┼──────────────────────┤
│ TRC20_USDT       │ TRC-20 (USDT)       │ 💰 USDT (Tron)      │
│ BEP20_USDT       │ BEP-20 (USDT)       │ 💰 USDT (BSC)       │
│ BNB              │ BNB (BSC)           │ 🪙 BNB              │
└──────────────────┴─────────────────────┴──────────────────────┘
```

---

## 🏗️ Architecture

### Composants

1. **Backend (Django)**
   - Modèle: `api/models.py:CryptoAddress`
   - Admin: `api/admin.py:CryptoAddressAdmin`
   - Serializer: `api/serializers.py:CryptoAddressSerializer`
   - ViewSet: `api/views.py:CryptoAddressViewSet`
   - API: `GET /api/crypto-addresses/`

2. **Frontend (React/TypeScript)**
   - Service: `frontend/src/services/api.ts:getCryptoAddresses()`
   - Page: `frontend/src/pages/WalletsPage.tsx` (Crypto tab)
   - Hook: `useEffect` pour charger les adresses

3. **Base de données**
   - Table: `api_cryptoaddress`
   - Champs: id, network, address, is_active, created_at, updated_at

### Flux de données

```
Admin Panel
    ↓
Backend (CryptoAddress Model)
    ↓
Database (api_cryptoaddress table)
    ↓
API (/api/crypto-addresses/)
    ↓
Frontend (React)
    ↓
User UI (Select dropdown + Address display)
```

---

## 👨‍💼 Guide Administrateur

### Accéder à l'interface

1. Allez à `http://localhost:8000/admin/`
2. Naviguez vers **Adresses crypto**

### Ajouter une adresse

1. Cliquez **"+ Ajouter adresse crypto"**
2. Sélectionnez le **Réseau** (TRC-20, BEP-20, ou BNB)
3. Collez l'**Adresse** complète
4. Cochez **Actif**
5. Cliquez **Enregistrer**

### Modifier une adresse

1. Cliquez sur l'adresse à modifier
2. Changez l'adresse ou le statut
3. Cliquez **Enregistrer**

### Désactiver un réseau

1. Cliquez sur le réseau
2. Décochez **Actif**
3. Cliquez **Enregistrer**
   - L'adresse reste en BD mais n'est pas visible aux users

### Vérifier l'affichage

Après enregistrement :
1. Allez à l'app: `http://localhost:5173/dashboard`
2. Ouvrez le modal **Dépôt**
3. Allez à l'onglet **Crypto**
4. Vérifiez que l'adresse s'affiche dans le dropdown

---

## 👤 Guide Utilisateur

### Effectuer un dépôt crypto

1. **Ouvrir le modal**
   - Portefeuille → Dépôt → Onglet "Crypto"

2. **Sélectionner le réseau**
   - Choisissez le réseau dans le dropdown

3. **Copier l'adresse**
   - L'adresse s'affiche automatiquement
   - Cliquez **"📋 Copier l'adresse"**

4. **Envoyer les fonds**
   - Ouvrez votre portefeuille (Binance, Trust Wallet, etc.)
   - Collez l'adresse
   - Confirmez l'envoi

5. **Entrer le TXID**
   - Copier l'ID de la transaction (TXID/Hash)
   - Collez-le dans le champ "Hash/TXID"

6. **Valider**
   - Cliquez **"✅ Valider le dépôt"**
   - Attendez la confirmation (5-30 min)

---

## 🧪 Tests et vérification

### Test automatisé

```bash
cd backend
python test_crypto_addresses.py
```

Ce script teste:
- ✅ Présence des adresses en BD
- ✅ Endpoint API fonctionnel
- ✅ Filtrage des adresses actives
- ✅ Choix de réseau disponibles
- ✅ Unicité des réseaux
- ✅ Serializer
- ✅ Enregistrement admin

### Test manuel

```bash
# Test de l'API
curl http://localhost:8000/api/crypto-addresses/

# Résultat attendu:
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "network": "TRC20_USDT",
      "network_display": "TRC-20 (USDT)",
      "address": "TR7NHqjeKQxGTCi8q282RYJMD3dDsm3h3e",
      "is_active": true
    },
    ...
  ]
}
```

---

## 🐛 Troubleshooting

### L'adresse n'apparaît pas dans l'app

**Causes possibles:**

1. **L'adresse n'est pas enregistrée**
   - Solution: Allez à /admin/ et ajoutez l'adresse

2. **L'adresse est inactif**
   - Solution: Cochez "Actif" et réenregistrez

3. **Cache du navigateur**
   - Solution: Ctrl+Shift+Delete (Clear cache) et rechargez

4. **Backend ne s'est pas relancé**
   - Solution: Redémarrez le serveur Django

### Les utilisateurs reçoivent "Aucun réseau disponible"

**Causes:**
- Aucune adresse n'a été enregistrée
- Toutes les adresses sont marquées "Inactif"

**Solution:**
```bash
# Vérifier en BD
python manage.py shell
>>> from api.models import CryptoAddress
>>> CryptoAddress.objects.all().values('network', 'is_active')
<QuerySet [...]>
```

### Erreur "Unregistered origin"

**Cela concerne Google Sign-In, pas les adresses crypto**

Si vous voyez cette erreur lors du dépôt crypto:
- Vérifiez que le backend tourne: `python manage.py runserver`
- Vérifiez que `VITE_API_BASE_URL` est correct
- Vérifiez les logs: `python manage.py runserver --verbosity 3`

### L'API retourne une liste vide

```bash
python manage.py shell
>>> from api.models import CryptoAddress
>>> CryptoAddress.objects.filter(is_active=True).count()
0  # ← Problème!
```

**Solution:** Enregistrez des adresses via /admin/

---

## 📊 États possibles

### Cycle de vie d'une adresse

```
1. CRÉATION
   │
   ├─ Actif ✅ (visible aux users)
   │
   ├─ Inactif ❌ (caché aux users)
   │
   └─ SUPPRESSION (admin seulement)
```

### Visibilité

```
Réglage "Actif"  │ Frontend  │ API
─────────────────┼───────────┼─────────
Oui ✅           │ Visible   │ Retourné
Non ❌           │ Caché     │ Exclu
```

---

## 🔐 Sécurité

### ✅ Bonnes pratiques

- Ne stocker **que les adresses publiques** (pas de clés privées)
- **Vérifier 2 fois** avant d'enregistrer une adresse
- **Tester** avec un petit montant avant de lancer
- **Monitorer** les transactions pour les fraudes

### ⚠️ À éviter

- ❌ Ne partager **jamais** les seedphrase/clés privées
- ❌ Ne pas faire confiance à une adresse non vérifiée
- ❌ Ne pas mélanger les réseaux (USDT TRC-20 ≠ USDT BEP-20)

---

## 📚 Fichiers de documentation

| Fichier | Audience | Contenu |
|---------|----------|---------|
| [CRYPTO_SETUP.md](../backend/CRYPTO_SETUP.md) | Admin | Configuration détaillée |
| [CRYPTO_DEPOSIT_GUIDE.md](../frontend/CRYPTO_DEPOSIT_GUIDE.md) | Utilisateurs | Guide des dépôts |
| [CRYPTO_ARCHITECTURE.md](../CRYPTO_ARCHITECTURE.md) | Développeurs | Architecture technique |
| [test_crypto_addresses.py](../backend/test_crypto_addresses.py) | DevOps | Script de test |

---

## 🚀 Checklist de déploiement

- [ ] Adresses TRC-20 enregistrées
- [ ] Adresses BEP-20 enregistrées
- [ ] Adresses BNB enregistrées (optionnel)
- [ ] Toutes testées avec une petite transaction ✅
- [ ] Frontend charge les adresses correctement
- [ ] Modal affiche les adresses
- [ ] Tests passent (`python test_crypto_addresses.py`)
- [ ] Support configuré pour les questions
- [ ] Documentation prête

---

## 📞 Support & Ressources

### Pour les administrateurs
- Django Admin: `http://localhost:8000/admin/`
- Logs: `python manage.py runserver --verbosity 3`
- Doc: Voir `CRYPTO_SETUP.md`

### Pour les utilisateurs
- Guide: Voir `CRYPTO_DEPOSIT_GUIDE.md`
- Email support: support@visafinance.io

### Explorateurs blockchain
- **Tron**: https://tronscan.org/
- **BSC**: https://bscscan.com/
- **Vérificateur USDT TRC-20**: https://tether.to/

---

## 🎓 Concepts clés

### Réseau blockchain
Chaque blockchain (Tron, BSC) a son propre réseau. USDT sur Tron ≠ USDT sur BSC.

### Adresse publique
Identifiant unique pour recevoir des fonds. Peut être partagée publiquement.

### TXID / Hash
ID unique de la transaction. Permet de vérifier que la transaction a été envoyée.

### Confirmation blockchain
Nombre de blocs ajoutés après la transaction. Plus il y en a, plus c'est sûr.

---

**Version**: 1.0  
**Dernière mise à jour**: Janvier 2026  
**Statut**: ✅ Production Ready
