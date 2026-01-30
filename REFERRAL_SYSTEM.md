# Système de Parrainage VISAFINANCE IA

## Vue d'ensemble

Le système de parrainage permet aux utilisateurs d'inviter de nouveaux membres et de suivre leur progression via les niveaux VIP.

## Fonctionnalités

### 1. Génération automatique du code de parrainage
- Chaque utilisateur reçoit automatiquement un code unique
- Format: URL complète `https://votresite.com/register?ref=CODE`
- Le code est généré à la création du compte ou à la première consultation

### 2. Partage du lien de parrainage

**Dashboard → Section "Code Parrainage"**

#### Bouton "Copier"
- Copie le lien complet dans le presse-papier
- Format: `https://votresite.com/register?ref=ABC123`
- Notification de succès "Code copié"

#### Bouton "Partager"
- Sur mobile: Utilise l'API native de partage
- Sur desktop: Copie automatiquement le lien
- Partage le lien complet avec le code de parrainage intégré

### 3. Inscription avec code de parrainage

**Page Register**

Lorsqu'un utilisateur clique sur le lien de parrainage:
1. Il est redirigé vers `/register?ref=CODE`
2. Le champ "Code de parrainage" est **automatiquement pré-rempli**
3. L'utilisateur n'a qu'à compléter le formulaire
4. À la soumission, le parrainage est enregistré automatiquement

### 4. Suivi de l'équipe

**Dashboard → Section "Mon équipe"**

Affiche en temps réel:
- **Total parrainés**: Nombre total de filleuls
- **Répartition par niveau VIP**: Combien de filleuls par niveau
  - Sans VIP (niveau 0)
  - Niveau VIP 1, 2, 3, etc.

#### Exemple d'affichage:
```
Mon équipe
─────────────────────────────
Total parrainés: 15

Répartition par niveau VIP
• Niveau VIP 7: 2
• Niveau VIP 5: 3
• Niveau VIP 3: 5
• Sans VIP: 5
```

## Architecture Backend

### Modèles Django

#### ReferralCode
```python
- code: Code unique (ex: "ABC123")
- referrer: Utilisateur parrain (OneToOne)
- created_at: Date de création
```

#### Referral
```python
- code: Lien vers ReferralCode
- referred_user: Utilisateur filleul
- status: 'pending', 'used', 'cancelled'
- created_at: Date de création
- used_at: Date d'utilisation
```

### API Endpoint

**GET /api/referrals/me**

Retourne:
```json
{
  "code": {
    "code": "ABC123",
    "referrer": {...},
    "created_at": "2026-01-30T..."
  },
  "referrals": [...],
  "stats": {
    "total_referred": 15,
    "used": 12,
    "pending": 3,
    "vip_breakdown": {
      "niveau_7": 2,
      "niveau_5": 3,
      "niveau_3": 5,
      "niveau_0": 5
    }
  }
}
```

## Architecture Frontend

### RegisterPage.tsx

```typescript
// Auto-remplissage du code depuis l'URL
useEffect(() => {
  const params = new URLSearchParams(location.search)
  const refFromUrl = params.get('ref')
  if (refFromUrl) {
    setValue('referralCode', refFromUrl)
  }
}, [location.search, setValue])
```

### DashboardPage.tsx

```typescript
// Génération du lien de parrainage
const inviteLink = code
  ? `${window.location.origin}/register?ref=${code}`
  : ''

// Copie dans le presse-papier
async function onCopy() {
  await navigator.clipboard.writeText(inviteLink)
  notify.success('Code copié')
}

// Partage natif (mobile) ou copie (desktop)
async function onShare() {
  if (navigator.share) {
    await navigator.share({ url: inviteLink })
  } else {
    await navigator.clipboard.writeText(inviteLink)
    notify.success('Lien copié')
  }
}
```

## Flux utilisateur complet

### Scénario: Alice parraine Bob

1. **Alice** va dans Dashboard → "Code Parrainage"
2. **Alice** clique sur "Partager"
3. Le lien est copié: `https://visafinance.com/register?ref=ALICE123`
4. **Alice** envoie le lien à **Bob** (WhatsApp, SMS, email, etc.)
5. **Bob** clique sur le lien → Redirection vers page Register
6. Le champ "Code de parrainage" contient déjà `ALICE123`
7. **Bob** complète le formulaire et s'inscrit
8. Le système enregistre Bob comme filleul d'Alice
9. **Alice** voit immédiatement Bob dans "Mon équipe"
10. Quand **Bob** achète un niveau VIP, la répartition d'**Alice** se met à jour

### Exemple chronologique

**T0**: Alice a 10 filleuls
```
Mon équipe: 10
├─ VIP 5: 2
├─ VIP 3: 3
└─ Sans VIP: 5
```

**T1**: Bob s'inscrit via le code d'Alice
```
Mon équipe: 11 (+1)
├─ VIP 5: 2
├─ VIP 3: 3
└─ Sans VIP: 6 (+1)  ← Bob ajouté ici
```

**T2**: Bob achète VIP niveau 5
```
Mon équipe: 11
├─ VIP 5: 3 (+1)  ← Bob monté ici
├─ VIP 3: 3
└─ Sans VIP: 5 (-1)
```

## Avantages du système

### Pour les parrains
✅ Suivi en temps réel de leur équipe
✅ Visibilité sur la progression des filleuls
✅ Partage facile via lien unique
✅ Statistiques détaillées par niveau VIP

### Pour les filleuls
✅ Inscription simplifiée (code pré-rempli)
✅ Pas besoin de copier/coller manuellement
✅ Expérience utilisateur fluide

### Pour la plateforme
✅ Tracking automatique des parrainages
✅ Données fiables pour les récompenses
✅ Croissance virale facilitée
✅ Analytics précis sur l'acquisition

## Extensibilité future

### Possibilités d'amélioration

1. **Récompenses de parrainage**
   - Bonus pour X filleuls actifs
   - Bonus quand un filleul atteint un niveau VIP élevé
   - Programme de récompenses à paliers

2. **Gamification**
   - Badges pour parrains actifs
   - Classement des meilleurs parrains
   - Défis mensuels de parrainage

3. **Analytics avancées**
   - Taux de conversion par parrain
   - Valeur moyenne des filleuls
   - ROI du programme de parrainage

4. **Notifications**
   - Alertes quand un filleul s'inscrit
   - Notifications quand un filleul monte de niveau
   - Rappels pour partager le code

## Configuration

### Variables d'environnement

```env
# Frontend
VITE_APP_URL=https://votresite.com

# Backend (si nécessaire)
REFERRAL_CODE_LENGTH=8
REFERRAL_REWARD_ENABLED=true
```

## Tests

### Test du flux complet

1. Créer un utilisateur A
2. Récupérer son code de parrainage
3. Ouvrir `/register?ref=CODE_DE_A`
4. Vérifier que le champ est pré-rempli
5. Créer l'utilisateur B
6. Vérifier que A voit B dans "Mon équipe"
7. Faire acheter un VIP à B
8. Vérifier que les stats de A se mettent à jour

### Test des boutons

```javascript
// Test copie
1. Cliquer sur "Copier"
2. Coller dans un éditeur de texte
3. Vérifier le format: https://site.com/register?ref=CODE

// Test partage (mobile)
1. Cliquer sur "Partager"
2. Vérifier que la boîte de partage s'ouvre
3. Partager via une app (WhatsApp, etc.)
```

## Sécurité

- ✅ Codes de parrainage uniques (vérification en base)
- ✅ Validation backend du code lors de l'inscription
- ✅ Prévention des auto-parrainages
- ✅ Rate limiting sur la création de codes
- ✅ Authentification requise pour voir les stats

## Performance

- ✅ Caching des statistiques de parrainage
- ✅ Indexation sur le champ `code`
- ✅ Requêtes optimisées avec `select_related`
- ✅ Agrégation côté base de données

## Support

En cas de problème:
1. Vérifier que le code existe en base
2. Vérifier les logs backend pour les erreurs
3. Tester avec un incognito/navigation privée
4. Vérifier les permissions API
