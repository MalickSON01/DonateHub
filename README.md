# DonateHub 🇧🇫

Application web de démonstration pour la création de campagnes de dons et la collecte de fonds via **Mobile Money** au Burkina Faso, avec simulation d'intégration **YengaPay**.

> ⚠️ **Projet de démo** : tout est simulé et stocké localement dans le navigateur (`localStorage`). Aucune donnée n'est envoyée à un serveur, aucun paiement réel n'est effectué.

## ✨ Fonctionnalités

- 📋 **Consultation libre** des campagnes et de leur historique de dons (aucune connexion requise)
- ❤️ **Don libre** sur n'importe quelle campagne, avec ou sans compte
- 🔐 **Authentification** (inscription / connexion par numéro de téléphone) requise uniquement pour créer une campagne
- ➕ **Création de campagne** avec titre, description, objectif, image et informations de reversement
- 📲 **Simulation de paiement Mobile Money** (flux `ONE_STEP` et `TWO_STEP` selon l'opérateur, avec OTP ou validation USSD)
- 💸 **Reversement (payout)** simulé au créateur d'une campagne, avec calcul de commission et de frais
- 📄 **Détail de campagne** avec historique complet des dons
- 🧾 Persistance locale (`localStorage`) des campagnes, dons et comptes utilisateurs

## 🏦 Opérateurs Mobile Money simulés

| Opérateur | Flux |
|---|---|
| 🟠 Orange Money | ONE_STEP |
| 🟣 Telecel Money | ONE_STEP |
| 🔵 Moov Money | TWO_STEP (OTP) |
| 🟢 Sank Money | TWO_STEP (OTP) |
| 🟡 Coris Money | TWO_STEP (OTP) |

## 📁 Structure du projet

```
donatehub/
├── index.html            # Structure HTML (page unique, modales, formulaires)
├── style.css             # Styles de l'application
├── scripts/
│   ├── core.js           # Données, utilitaires, authentification, onglets
│   └── campaigns.js      # Campagnes, dons, simulation de paiement, reversement, init
└── README.md             # Ce fichier
```

### `core.js`
Contient les fondations de l'application, chargées en premier :
- **Données** : le tableau `campaigns` (état de l'app) et les valeurs par défaut
- **Utilitaires** : formatage des montants, dates relatives, notifications (toast)
- **Validation de formulaire** : affichage/suppression des messages d'erreur
- **Champs montant** : formatage automatique des saisies numériques (ex: `50 000`)
- **Gestion des utilisateurs** : stockage local des comptes (`donatehub_users`)
- **Authentification** : inscription, connexion, déconnexion, barre d'authentification, modale de connexion
- **Navigation par onglets** : basculement entre la liste des campagnes et le formulaire de création

### `campaigns.js`
Contient la logique métier de l'application, chargée après `core.js` :
- **Image de campagne** : prévisualisation et suppression de l'image choisie
- **Affichage** : rendu de la liste des campagnes et de leur barre de progression
- **Création de campagne** : validation et enregistrement d'une nouvelle campagne
- **Don** : ouverture de la modale de don, sélection de l'opérateur
- **Simulation de paiement** : étapes animées imitant l'appel à l'API YengaPay (connexion, authentification, initiation, OTP ou validation USSD)
- **Reversement (payout)** : calcul de la commission et des frais, simulation du transfert au créateur
- **Détail de campagne** : historique complet des dons
- **Initialisation** : premier rendu de l'application au chargement de la page

> ⚠️ **Ordre de chargement important** : `core.js` doit être chargé **avant** `campaigns.js` dans `index.html`, car `campaigns.js` utilise les variables et fonctions définies dans `core.js` (données, authentification, utilitaires).

```html
<script src="scripts/core.js"></script>
<script src="scripts/campaigns.js"></script>
```

## 🚀 Utilisation

1. Télécharger les fichiers `index.html`, `style.css`, `core.js` et `campaigns.js` dans un même dossier
2. Ouvrir `index.html` dans un navigateur (aucun serveur ni installation requise)
3. Parcourir les campagnes, faire un don, ou créer un compte pour lancer une campagne

## 🗄️ Stockage local

L'application utilise trois clés `localStorage` :

| Clé | Contenu |
|---|---|
| `donatehub_campaigns` | Liste des campagnes et de leurs dons |
| `donatehub_user` | Session de l'utilisateur actuellement connecté |
| `donatehub_users` | Base des comptes inscrits (téléphone + mot de passe) |

## 🛠️ Stack technique

- HTML / CSS / JavaScript vanilla (aucune dépendance, aucun build)
- Stockage via `localStorage` du navigateur
