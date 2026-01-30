# Système de Gestion des Comptes Bancaires

## Vue d'ensemble

Le système permet aux utilisateurs d'enregistrer et de gérer leurs comptes bancaires et comptes d'opérateurs mobiles (Orange Money, Airtel Money, M-Pesa) pour faciliter les retraits.

## Architecture

### Backend (Django)

#### Modèle `UserBankAccount`
- **Champs:**
  - `user`: Utilisateur propriétaire
  - `account_type`: 'bank' ou 'operator'
  - `bank_name`: Nom de la banque (si type = bank)
  - `operator_name`: Nom de l'opérateur (si type = operator)
  - `account_number`: Numéro de compte
  - `account_holder_name`: Nom du titulaire
  - `is_active`: Compte actif
  - `is_default`: Compte par défaut

#### API Endpoints
- `GET /api/bank-accounts/` - Liste des comptes de l'utilisateur
- `POST /api/bank-accounts/` - Créer un nouveau compte
- `PATCH /api/bank-accounts/{id}/` - Modifier un compte
- `DELETE /api/bank-accounts/{id}/` - Supprimer un compte
- `POST /api/bank-accounts/{id}/set_default/` - Définir comme défaut

### Frontend (React + TypeScript)

#### DashboardPage - Modal "Compléter compte"
**Fonctionnalités:**
- Affichage de tous les comptes enregistrés
- Ajout de nouveaux comptes (banque ou opérateur)
- Sélection depuis une liste prédéfinie de banques:
  - Rawbank, Equity BCDC, TMB, BGFIBank, Ecobank, Access Bank, Sofibanque, FBN Bank, Autre
- Sélection depuis une liste d'opérateurs:
  - Orange Money, Airtel Money, Vodacom M-Pesa
- Définir un compte comme défaut
- Supprimer un compte

#### WalletsPage - Modal "Retrait"
**Fonctionnalités:**
- Affichage automatique des comptes enregistrés
- Sélection visuelle du compte de destination
- Auto-sélection du compte par défaut
- Validation: impossible de retirer sans compte enregistré
- Message d'aide avec lien vers le Dashboard si aucun compte

## Flux d'utilisation

### 1. Enregistrement de compte
1. L'utilisateur va dans Dashboard
2. Clique sur "Compléter votre compte"
3. Choisit le type (Banque ou Opérateur)
4. Sélectionne depuis la liste
5. Saisit le numéro de compte et le nom du titulaire
6. Enregistre

### 2. Retrait
1. L'utilisateur va dans Wallets
2. Clique sur "Retrait"
3. Sélectionne un compte parmi ceux enregistrés
4. Saisit le montant
5. Confirme

### 3. Gestion des comptes
- Définir un compte comme défaut (utilisé automatiquement)
- Supprimer un compte obsolète
- Ajouter plusieurs comptes

## Sécurité

- Les comptes sont liés à l'utilisateur authentifié
- Validation backend des données
- Impossible d'accéder aux comptes d'autres utilisateurs
- Validation du type de compte (bank nécessite bank_name, operator nécessite operator_name)

## Base de données

### Table: `api_userbankaccount`
```sql
CREATE TABLE api_userbankaccount (
    id BIGINT PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    account_type VARCHAR(20),
    bank_name VARCHAR(100),
    operator_name VARCHAR(50),
    account_number VARCHAR(100),
    account_holder_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Améliorations futures

1. Validation des numéros de compte (format spécifique par banque/opérateur)
2. Historique des modifications de comptes
3. Vérification des comptes (micro-dépôt)
4. Gestion des limites de retrait par compte
5. Notifications lors de l'ajout/suppression de compte
