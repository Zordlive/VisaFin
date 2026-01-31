# 🧪 Guide de Test Complet - Notifications Admin Instantanées

## 📌 Vue d'Ensemble
Le système crée automatiquement une notification admin **instantanément** quand un utilisateur confirme une transaction (dépôt ou retrait). L'admin voit la notification sur le tableau de bord `/admin`.

---

## 🧑‍💻 Scénario de Test 1: Dépôt Utilisateur

### Préalables:
- ✅ 2 comptes: 1 utilisateur régulier + 1 administrateur
- ✅ Application en cours d'exécution (backend + frontend)

### Étapes:

#### Étape 1: Utilisateur Initie un Dépôt
```
1. Se connecter en tant qu'utilisateur (user@example.com)
2. Cliquer sur "Dépôt des fonds" dans la navigation
3. Remplir le formulaire:
   - Montant: 100
   - Méthode: Orange Money
   - Devise: USDT (défaut)
4. Cliquer sur "Effectuer le dépôt"
5. Voir le message de succès: "Dépôt initié avec succès"
```

#### Étape 2: Backend Crée la Notification
```python
# Backend process (automatique):
# 1. POST /api/deposits/initiate reçu
# 2. Créer: Deposit(user=user1, amount=100, currency='USDT', status='pending')
# 3. Créer: AdminNotification(
#     admin=<superuser>,
#     user=user1,
#     notification_type='deposit',
#     amount=100,
#     account_info='Dépôt via Orange Money',
#     deposit=<dépôt créé>,
#     is_read=False
# )
# 4. Retourner: { deposit_id, instructions, status }
```

#### Étape 3: Admin Voit la Notification
```
1. Se déconnecter de l'utilisateur
2. Se connecter en tant qu'admin (admin@example.com)
3. Cliquer sur l'avatar → aller au tableau de bord
   OU accéder directement: http://localhost:5173/admin
4. Voir l'onglet "Notifications" avec la nouvelle notification:
   ✓ Type: Dépôt (badge vert)
   ✓ Montant: 100 USD
   ✓ Utilisateur: user@example.com
   ✓ Compte: Dépôt via Orange Money
   ✓ Date/Heure: Maintenant
   ✓ État: Non lue (surlignée en orange)
5. Cliquer sur la notification pour la marquer comme lue
   → Disparaît la surligne orange
   → Badge de compteur diminue de 1
```

---

## 💰 Scénario de Test 2: Retrait Utilisateur

### Préalables:
- ✅ Même configuration que Test 1
- ✅ Utilisateur avec solde suffisant dans le portefeuille

### Étapes:

#### Étape 1: Utilisateur Initie un Retrait
```
1. Se connecter en tant qu'utilisateur
2. Cliquer sur "Retrait des fonds" dans la navigation
3. Remplir le formulaire:
   - Banque/Opérateur: Orange Monnaie
   - Numéro de compte: 0971234567
   - Montant à retirer: 50
4. Cliquer sur "Effectuer le retrait"
5. Voir le message de succès: "Demande de retrait effectuée avec succès"
```

#### Étape 2: Backend Crée la Notification
```python
# Backend process (automatique):
# 1. POST /api/withdrawals/ reçu
# 2. WithdrawalViewSet.create() appelé
# 3. perform_create() exécuté:
#    a) Créer: Withdrawal(
#       user=user1,
#       amount=50,
#       bank='Orange Monnaie',
#       account='0971234567',
#       status='pending'
#    )
#    b) Créer: AdminNotification(
#       admin=<superuser>,
#       user=user1,
#       notification_type='withdrawal',
#       amount=50,
#       account_info='Orange Monnaie - 0971234567',
#       withdrawal=<retrait créé>,
#       is_read=False
#    )
# 4. Retourner les données du retrait
```

#### Étape 3: Admin Voit et Traite le Retrait
```
1. Admin accède à http://localhost:5173/admin
2. Voir 2 onglets:
   ✓ "Notifications" (affiche dépôt + retrait)
   ✓ "Retraits à Traiter" (affiche seulement les retraits pending)
3. Cliquer sur l'onglet "Retraits à Traiter"
4. Voir le retrait:
   ✓ Type: Retrait (badge rouge)
   ✓ Montant: 50 USD
   ✓ Utilisateur: user@example.com
   ✓ Téléphone: +<numéro si disponible>
   ✓ Compte: Orange Monnaie - 0971234567
   ✓ Date: Maintenant
   ✓ Statut: Pending (badge orange)
5. Cliquer sur le retrait → Modal s'ouvre
6. Modal montre tous les détails:
   - Utilisateur
   - Email
   - Téléphone
   - Montant
   - Banque
   - Compte
   - Statut actuel
7. Sélectionner l'action:
   - Option A: Approuver → Statut devient "Completed" (vert)
   - Option B: Rejeter → Ajouter une raison → Statut devient "Rejected" (rouge)
8. Cliquer "Confirmer"
9. Le modal se ferme et le statut se met à jour immédiatement
10. Voir le retrait dans "Retraits à Traiter" avec le nouveau statut
```

---

## ⏱️ Tests de Temps Réel

### Test 1: Refresh Automatique
```
Scénario: L'admin est sur le tableau de bord, l'utilisateur crée un retrait
1. Admin ouvre /admin à 14:00:00
2. Admin attend 5 secondes (pas d'activité)
3. Utilisateur crée un retrait à 14:00:05
4. Admin attend la prochaine mise à jour (toutes les 10 secondes)
5. À 14:00:10, le tableau de bord se rafraîchit
6. La nouvelle notification apparaît ✓

Résultat: La notification apparaît dans les 10 secondes maximum
```

### Test 2: Compteurs
```
Scénario: Admin voit le nombre de notifications
1. Aucune notification: Aucun badge "0"
2. 1 notification non lue: Badge "1" rouge sur l'onglet Notifications
3. 2 notifications non lues: Badge "2" rouge
4. Admin marque 1 comme lue: Badge "1" rouge
5. Admin marque tout comme lu: Pas de badge
```

---

## 🔍 Vérification Technique

### Backend - Vérification des Endpoints

#### Endpoint de Dépôt
```bash
curl -X POST http://localhost:8000/api/deposits/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "method": "orange",
    "currency": "USDT"
  }'

# Réponse attendue:
# {
#   "deposit_id": 1,
#   "instructions": { "provider": "mock", "payment_address": "mock_address" },
#   "status": "pending"
# }

# Effet secondaire: AdminNotification créée avec type='deposit'
```

#### Endpoint de Retrait
```bash
curl -X POST http://localhost:8000/api/withdrawals/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "bank": "Orange Monnaie",
    "account": "0971234567",
    "status": "pending"
  }'

# Réponse attendue:
# {
#   "id": 1,
#   "user": 1,
#   "user_username": "testuser",
#   "user_email": "user@example.com",
#   "amount": 50,
#   "bank": "Orange Monnaie",
#   "account": "0971234567",
#   "status": "pending",
#   ...
# }

# Effet secondaire: AdminNotification créée avec type='withdrawal'
```

#### Endpoint de Notifications Admin
```bash
curl -X GET http://localhost:8000/api/admin-notifications/ \
  -H "Authorization: Bearer <admin_token>"

# Réponse attendue (tableau):
# {
#   "count": 2,
#   "results": [
#     {
#       "id": 1,
#       "admin": 1,
#       "user": 2,
#       "user_username": "testuser",
#       "user_email": "user@example.com",
#       "notification_type": "withdrawal",
#       "notification_type_display": "Retrait",
#       "amount": 50,
#       "account_info": "Orange Monnaie - 0971234567",
#       "is_read": false,
#       "withdrawal": 1,
#       "deposit": null,
#       "created_at": "2024-01-30T14:00:05Z"
#     },
#     {
#       "id": 2,
#       "admin": 1,
#       "user": 2,
#       "notification_type": "deposit",
#       "notification_type_display": "Dépôt",
#       "amount": 100,
#       ...
#     }
#   ]
# }
```

#### Endpoint de Traitement du Retrait
```bash
curl -X POST http://localhost:8000/api/withdrawals/1/process/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete"
  }'

# Réponse attendue:
# { "message": "Retrait complété" }

# OU avec rejet:
curl -X POST http://localhost:8000/api/withdrawals/1/process/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "reason": "Compte invalide"
  }'

# Réponse attendue:
# { "message": "Retrait rejeté" }
```

---

## ✅ Validation Finale

### Frontend
- [ ] Page de dépôt envoie POST à `/api/deposits/initiate`
- [ ] Page de retrait envoie POST à `/api/withdrawals/`
- [ ] Page admin `/admin` existe et affiche les notifications
- [ ] Onglets "Notifications" et "Retraits à Traiter" fonctionnent
- [ ] Badges de compteur apparaissent
- [ ] Modal de traitement s'ouvre/se ferme correctement
- [ ] Refresh automatique toutes les 10 secondes

### Backend
- [ ] `python manage.py check` ✓ No issues
- [ ] `DepositViewSet.initiate()` crée AdminNotification
- [ ] `WithdrawalViewSet.perform_create()` crée AdminNotification
- [ ] `/api/admin-notifications/` endpoint accessible
- [ ] `/api/withdrawals/{id}/process/` endpoint fonctionne
- [ ] Statuts de retrait mis à jour correctement

### Base de Données
- [ ] Table `Withdrawal` existe et contient les enregistrements
- [ ] Table `AdminNotification` existe avec les notifications
- [ ] ForeignKeys fonctionnent correctement
- [ ] Timestamps (`created_at`, `updated_at`, `processed_at`) enregistrés

---

## 📊 Résultats Attendus Après les Tests

### Scénario 1 (Dépôt):
```
Avant: Aucune notification
Utilisateur crée dépôt
Après: 1 notification "Dépôt" en attente sur le tableau de bord admin
```

### Scénario 2 (Retrait):
```
Avant: 0 retrait en attente
Utilisateur crée retrait
Après: 
  - 1 notification "Retrait" non lue
  - 1 retrait en attente dans l'onglet "Retraits à Traiter"
Admin clique approuver
Après:
  - Retrait statut = "completed"
  - Processed_by = admin
  - Processed_at = maintenant
```

---

## 🚨 Dépannage

### Problème: Notification n'apparaît pas
**Solution:**
1. Vérifier que l'admin existe: `User.objects.filter(is_staff=True, is_superuser=True).first()`
2. Vérifier la base de données: `AdminNotification.objects.all()`
3. Vérifier les logs backend pour les erreurs
4. Rafraîchir manuellement la page `/admin`

### Problème: Endpoint retourne 404
**Solution:**
1. Vérifier l'enregistrement du router: `urls.py` ligne 12-13
2. Vérifier le nom du ViewSet: `WithdrawalViewSet`, `AdminNotificationViewSet`
3. Vérifier la permission `IsAuthenticated`

### Problème: Retrait affiche 500 error
**Solution:**
1. Vérifier les imports dans `views.py`: `Withdrawal`, `AdminNotification`, `User`
2. Vérifier la méthode `perform_create()` du WithdrawalViewSet
3. Vérifier la base de données pour les contraintes FK

---

## 📈 Métriques de Succès

✅ **Notification instantanée**: < 1 seconde après confirmation  
✅ **Couverture complète**: Dépôts ET retraits  
✅ **Suivi administrateur**: Tous les détails disponibles  
✅ **Traitement facile**: Interface intuitive pour approuver/rejeter  
✅ **Audit trail complet**: Timestamps, IDs, raisons de rejet  

