# 🏗️ Architecture de la Gestion des Adresses Crypto

## Schéma de la Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      ADMINISTRATEUR                          │
│              (Django Admin Interface)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │   CryptoAddress Model     │
         ├───────────────────────────┤
         │ • id (Auto)               │
         │ • network (CharField)     │
         │   ├─ TRC20_USDT          │
         │   ├─ BEP20_USDT          │
         │   └─ BNB                 │
         │ • address (CharField)     │
         │ • is_active (Boolean)     │
         │ • created_at              │
         │ • updated_at              │
         └────────┬──────────────────┘
                  │
         ┌────────▼────────┐
         │ API Endpoint    │
         │ GET /api/       │
         │ crypto-        │
         │ addresses/     │
         └────────┬────────┘
                  │
         ┌────────▼──────────────────┐
         │  Frontend (React)          │
         │                            │
         │  WalletsPage.tsx           │
         │  ├─ loadCryptoAddresses()  │
         │  ├─ CryptoAddress[]        │
         │  └─ <select> dropdown      │
         └────────┬───────────────────┘
                  │
         ┌────────▼──────────────────────┐
         │  User Interface               │
         │                               │
         │  Modal Dépôt                  │
         │  ├─ Sélect réseau             │
         │  ├─ Affichage adresse         │
         │  ├─ Copier adresse            │
         │  ├─ Entrer TXID               │
         │  └─ Valider                   │
         └───────────────────────────────┘
```

---

## 🔄 Flux de données

### 1️⃣ Enregistrement (Admin)

```
Admin accède à /admin/
    ↓
Admin clicks "Adresses crypto" 
    ↓
Admin clicks "+ Ajouter adresse crypto"
    ↓
Admin remplit le formulaire:
  • Réseau: [TRC20_USDT / BEP20_USDT / BNB]
  • Adresse: [0x1234...abcd]
  • Actif: [☑ Coché]
    ↓
Admin clicks "Enregistrer"
    ↓
Data saved to Database ✅
```

### 2️⃣ Consultation (Frontend)

```
User ouvre l'app
    ↓
Composant WalletsPage se monte
    ↓
useEffect() → loadCryptoAddresses()
    ↓
GET /api/crypto-addresses/ (depuis le backend)
    ↓
Backend retourne:
  [
    {
      "id": 1,
      "network": "TRC20_USDT",
      "network_display": "TRC-20 (USDT)",
      "address": "TRxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "is_active": true
    },
    {
      "id": 2,
      "network": "BEP20_USDT",
      "network_display": "BEP-20 (USDT)",
      "address": "0x55d398326f99059fF775485246999027B3197955",
      "is_active": true
    }
  ]
    ↓
setState(cryptoAddresses)
    ↓
<select> se remplit automatiquement ✅
```

### 3️⃣ Sélection d'adresse (User)

```
User clicks <select>
    ↓
User selects "TRC-20 (USDT)"
    ↓
setCryptoChannel("TRC20_USDT")
    ↓
Condition: 
  cryptoChannel && 
  cryptoAddresses.find(a => a.network === cryptoChannel)
    ↓
Zone d'affichage devient visible ✅
    ↓
L'adresse s'affiche:
  ├─ Réseau: TRC-20 (USDT)
  ├─ Adresse: TRxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ├─ Bouton copier ✅
  └─ Avertissement
```

### 4️⃣ Validation de dépôt

```
User copie l'adresse ✅
    ↓
User envoie crypto depuis son portefeuille
    ↓
User obtient le TXID
    ↓
User remplit:
  • TXID: [0xabcd1234...]
  • Montant: [100]
    ↓
User clicks "Valider le dépôt"
    ↓
POST /api/deposits/
  {
    "amount": 100,
    "channel": "TRC20_USDT",
    "txid": "0xabcd1234...",
    "type": "CRYPTO"
  }
    ↓
Backend crée un Deposit record
    ↓
Admin voit le dépôt en attente
    ↓
Admin valide après confirmation blockchain
    ↓
Montant crédité au portefeuille user ✅
```

---

## 📊 Modèle de données

### Tableau CryptoAddress

```sql
CREATE TABLE api_cryptoaddress (
  id                INTEGER PRIMARY KEY AUTO_INCREMENT,
  network           VARCHAR(20) UNIQUE NOT NULL,
    -- Valeurs: 'TRC20_USDT', 'BEP20_USDT', 'BNB'
  address           VARCHAR(255) NOT NULL,
    -- Exemple: 'TRxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        DATETIME AUTO_NOW_ADD,
  updated_at        DATETIME AUTO_NOW
);
```

### Options de réseau

```
┌────────────┬──────────────────────────┬─────────────────────┐
│ Value      │ Display                  │ Exemple             │
├────────────┼──────────────────────────┼─────────────────────┤
│ TRC20_USDT │ TRC-20 (USDT)           │ TR7NHqje...         │
│ BEP20_USDT │ BEP-20 (USDT)           │ 0x55d398...         │
│ BNB        │ BNB (Binance Smart C..) │ 0x1234ab...         │
└────────────┴──────────────────────────┴─────────────────────┘
```

---

## 🔐 Règles de validation

### ✅ Ce qui est autorisé

```javascript
// Créer une adresse
{
  network: "TRC20_USDT",      // ✅ Une des 3 options
  address: "TRxxxxxxxxxxx",   // ✅ Respecte le format
  is_active: true             // ✅ Boolean
}

// Mettre à jour une adresse
{
  network: "TRC20_USDT",      // ✅ Ne peut pas être changé
  address: "TRyyyyyyyyyy",    // ✅ Peut être changée
  is_active: false            // ✅ Peut être désactivée
}
```

### ❌ Ce qui est interdit

```javascript
// Réseau invalide
{ network: "DOGECOIN" }  // ❌ Non supporté

// Adresse invalide
{ address: "" }          // ❌ Vide
{ address: "invalid" }   // ❌ Format incorrect

// Doublons
{ network: "TRC20_USDT", address: "..." }  // ❌ Déjà existant
```

---

## 🔄 États possibles

### État du réseau

```
ACTIF ✅              INACTIF ❌
├─ Visible en UI      ├─ Invisible en UI
├─ Accessible users   ├─ Non accessible
└─ Accepte dépôts     └─ Refuse dépôts
```

### Séquence de vie

```
Enregistrement
    ↓
  [Actif ✅] ──────────┐
  [Inactif ❌]         │
    ↓                  ↓
(Admin peut basculer entre les deux)
    ↓
Suppression (Admin seulement)
```

---

## 🧪 Exemple complet

### Cas d'usage : Ajouter TRC-20 USDT

**Admin actions :**
```
1. Va à /admin/api/cryptoaddress/
2. Clique "+ Ajouter adresse crypto"
3. Remplir:
   - Réseau: [TRC-20 (USDT)]
   - Adresse: [TR7NHqjeKQxGTCi8q282RYJMD3dDsm3h3e]
   - Actif: [✓ Coché]
4. Click "Enregistrer"
```

**Database state :**
```sql
INSERT INTO api_cryptoaddress 
  (network, address, is_active, created_at)
VALUES 
  ('TRC20_USDT', 'TR7NHqjeKQxGTCi8q282RYJMD3dDsm3h3e', 1, NOW());
```

**User sees :**
```
Dépôt > Crypto
├─ Sélectionner le réseau: [TRC-20 (USDT) ✓]
├─ Adresse de dépôt:
│  ├─ Réseau: TRC-20 (USDT)
│  ├─ Adresse: TR7NHqjeKQxGTCi8q282RYJMD3dDsm3h3e
│  └─ 📋 Copier l'adresse
└─ Hash/TXID: [Input field...]
```

---

## 🚀 Déploiement

### Checklist avant production

- [ ] Adresses TRC-20 USDT enregistrées
- [ ] Adresses BEP-20 USDT enregistrées
- [ ] Toutes les adresses testées ✅
- [ ] Support email configuré
- [ ] Monitoring des transactions en place
- [ ] Guide utilisateur prêt

---

## 📞 Support

Si vous avez des questions sur cette architecture:
- Vérifiez les logs: `python manage.py runserver --verbosity 3`
- Consultez le fichier `CRYPTO_SETUP.md`
- Testez avec `curl http://localhost:8000/api/crypto-addresses/`
