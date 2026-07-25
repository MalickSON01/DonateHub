# 🇧🇫 DonateHub

Plateforme de démonstration pour des campagnes de dons au Burkina Faso, avec simulation de paiement Mobile Money (via une fausse intégration "YengaPay").

> ⚠️ **Projet de démonstration / prototype.** Aucun vrai paiement n'est effectué, aucune donnée n'est envoyée à un serveur. Tout est stocké **localement dans le navigateur** (`localStorage`). Ne pas utiliser tel quel en production.

---

## 📁 Structure du projet

```
donatehub/
├── index.html   → Structure de la page (HTML)
├── style.css    → Mise en forme (CSS)
├── script.js    → Logique de l'application (JavaScript)
└── README.md    → Ce fichier
```

Les trois fichiers doivent rester dans le **même dossier** : `index.html` charge `style.css` et `script.js` par chemin relatif.

## ▶️ Lancer le projet

Aucune installation n'est nécessaire — c'est du HTML/CSS/JS pur, sans dépendance ni build.

Il suffit d'ouvrir `index.html` dans un navigateur (double-clic, ou clic droit → "Ouvrir avec" → navigateur).

## ✨ Fonctionnalités

### Consultation & dons (accès libre, sans compte)
- Parcourir la liste des campagnes actives
- Voir le détail d'une campagne : description, progression, historique des dons
- Faire un don, avec simulation complète du parcours de paiement Mobile Money :
  - Choix de l'opérateur (Orange Money, Moov Money, Sank Money, Coris Money, Telecel Money)
  - Simulation **ONE_STEP** (validation USSD) pour Orange et Telecel
  - Simulation **TWO_STEP** (code OTP par SMS) pour Moov, Sank et Coris
  - Génération d'un identifiant de transaction fictif

### Création de campagne (compte requis)
- Le bouton **"Créer une campagne"** est accessible à tout moment, mais redirige vers une modale **Connexion / Inscription** si l'utilisateur n'est pas connecté
- Après connexion ou inscription réussie, l'utilisateur est automatiquement renvoyé vers le formulaire de création
- Formulaire de campagne : titre, description, objectif (XOF), nom du porteur, numéro Mobile Money de reversement, opérateur, image
- **Image de la campagne** : sélection directe depuis la galerie de l'appareil (`input type="file"`), avec aperçu ; si aucune image n'est choisie, une image par défaut générée localement (SVG) est utilisée

### Compte utilisateur
- Inscription et connexion par **numéro de téléphone + mot de passe**
- Les comptes sont stockés dans une "base de données" JSON côté navigateur (`localStorage`, clé `donatehub_users`)
- Bouton 👁️ pour afficher/masquer le mot de passe saisi
- Erreurs de validation affichées **directement sous le champ concerné** (bordure rouge + message), plutôt que dans une notification générique
- Un utilisateur connecté ne peut gérer (voir le badge "Votre campagne", déclencher le reversement) que les campagnes créées avec son propre numéro

### Reversement (payout)
- Le créateur d'une campagne peut déclencher un reversement simulé une fois qu'un minimum a été collecté
- Détail du calcul affiché : montant collecté, commission (5 %), frais Mobile Money (~1,5 %), montant net reversé

### Confort de saisie
- Les champs de montant (objectif de campagne, montant du don) formatent automatiquement les chiffres saisis avec des espaces (ex. `50000` → `50 000`) pour une meilleure lisibilité

## 💾 Données & stockage

Tout est conservé dans le `localStorage` du navigateur, sous ces clés :

| Clé                     | Contenu                                      |
|-------------------------|-----------------------------------------------|
| `donatehub_campaigns`   | Liste des campagnes et de leurs dons          |
| `donatehub_users`       | Comptes inscrits (numéro + mot de passe)      |
| `donatehub_user`        | Session de l'utilisateur actuellement connecté |

Pour repartir de zéro : vider le `localStorage` du site (ou ouvrir la page en navigation privée).

## 🔐 Limites connues (démo)

- Les mots de passe sont stockés **en clair** dans le `localStorage` (pas de hachage) — acceptable uniquement pour une démo locale.
- Aucune vérification serveur : toute personne ayant accès au navigateur peut lire ces données via les outils de développement.
- Les paiements et reversements sont **entièrement simulés** (aucun appel réseau réel vers un opérateur Mobile Money).
- Les images de campagne (base64) sont stockées dans le `localStorage`, dont la capacité est limitée (quelques Mo) — à surveiller si beaucoup de campagnes/images sont créées.

## 🚀 Pistes d'évolution (hors périmètre de cette démo)

- Backend réel avec base de données et hachage des mots de passe
- Vraie intégration API Mobile Money
- Upload d'image vers un service de stockage (au lieu du base64 en local)
- Authentification par token / session sécurisée
