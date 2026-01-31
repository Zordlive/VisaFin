# 🔐 Guide de Configuration des Adresses Crypto

## Vue d'ensemble
Ce guide explique comment enregistrer et gérer les adresses crypto pour les dépôts utilisateurs.

---

## 📋 Accéder à la gestion des adresses crypto

### Via l'interface Django Admin
1. **Allez à** : `http://localhost:8000/admin/`
2. **Connectez-vous** avec vos identifiants administrateur
3. **Naviguez vers** : `Adresses crypto` (dans le menu de gauche)

---

## ➕ Ajouter une nouvelle adresse crypto

### Étapes :

1. **Cliquez sur** "Ajouter adresse crypto" (bouton vert en haut)

2. **Remplissez les champs** :
   - **Réseau** : Sélectionnez le type de réseau
     - `TRC-20 (USDT)` - Tron Network
     - `BEP-20 (USDT)` - Binance Smart Chain
     - `BNB (Binance Smart Chain)` - Native BNB
   
   - **Adresse** : Collez l'adresse complète de votre portefeuille crypto
     - Exemple USDT TRC-20: `TR7NHqjeKQxGTCi8q282RYJMD3dDsm3h3e`
     - Exemple USDT BEP-20: `0x55d398326f99059fF775485246999027B3197955`

   - **Actif** : Cochez cette case pour activer le réseau
     - Les adresses inactives ne s'affichent pas aux utilisateurs

3. **Cliquez sur** "Enregistrer"

---

## 🔄 Éditer une adresse existante

1. **Naviguez vers** : Adresses crypto (Admin)
2. **Cliquez** sur le réseau à éditer
3. **Modifiez** l'adresse ou l'état "Actif"
4. **Cliquez** "Enregistrer"

---

## ✅ Vérifier l'affichage

Après l'enregistrement :
1. **Allez à votre app** : `http://localhost:5173/dashboard`
2. **Ouvrez** le modal "Dépôt"
3. **Sélectionnez** l'onglet "Crypto"
4. **Vérifiez** que votre adresse apparaît dans le select "Sélectionner le réseau"

---

## 🚨 Points importants

### ⚠️ Une adresse par réseau
- Chaque réseau ne peut avoir qu'**UNE** adresse enregistrée
- Si vous mettez à jour une adresse, l'ancienne sera remplacée

### 🔐 Sécurité des adresses
- **Ne partagez jamais** vos clés privées ou seedphrase
- Les adresses publiques peuvent être partagées sans danger
- Vérifiez toujours l'adresse **plusieurs fois** avant de l'enregistrer

### 🌐 Correspondance des réseaux
| Réseau | Symbole | Cas d'usage |
|--------|---------|-----------|
| TRC-20 (USDT) | USDT | Tron Network (peu de frais) |
| BEP-20 (USDT) | USDT | Binance Smart Chain |
| BNB | BNB | Binance Smart Chain (native) |

---

## 💡 Conseils

1. **Avant d'activer** : Testez l'adresse avec une petite transaction
2. **Conservez une trace** : Notez les dates de mise à jour des adresses
3. **Vérification double** : Demandez à un collègue de vérifier l'adresse enregistrée
4. **Sauvegardez** : Gardez une copie sécurisée de vos adresses

---

## 🔗 Ressources utiles

- **Tron USDT** : https://tronscan.org/
- **BSC USDT** : https://bscscan.com/
- **Vérifier une adresse** : https://www.blockchain.com/explorer

---

## ❓ Dépannage

### L'adresse n'apparaît pas dans l'app ?
- Vérifiez que `Actif` est **coché**
- Videz le cache du navigateur (Ctrl+Shift+Delete)
- Rechargez la page de dépôt

### Les utilisateurs reçoivent une erreur ?
- Vérifiez que l'adresse est **valide** (bonne longueur, bons caractères)
- Assurez-vous que le **réseau est correct**
- Consultez les logs du serveur : `python manage.py runserver --verbosity 3`

---

**Questions ?** Contactez l'équipe technique.
