# Application de Gestion de Stock - Frontend

Application frontend Angular Material pour la gestion de stock d'entreprise, inspirée du template Vex avec des couleurs personnalisées.

## Technologies Utilisées

- **Angular 20** - Framework principal
- **Angular Material** - Composants UI
- **TypeScript** - Langage de programmation
- **SCSS** - Préprocesseur CSS
- **RxJS** - Programmation réactive

## Architecture

L'application suit une architecture modulaire:

```
src/app/
├── core/                 # Services principaux et configuration
│   ├── services/        # Services API
│   ├── guards/          # Route guards
│   └── interceptors/    # HTTP interceptors
├── shared/              # Modules et composants partagés
│   ├── components/      # Composants réutilisables
│   ├── models/          # Interfaces et modèles de données
│   ├── directives/      # Directives personnalisées
│   └── pipes/           # Pipes personnalisés
└── features/            # Modules de fonctionnalités
    ├── dashboard/       # Tableau de bord
    ├── products/        # Gestion des produits
    ├── categories/      # Gestion des catégories
    ├── suppliers/       # Gestion des fournisseurs
    ├── stock-movements/ # Mouvements de stock
    └── reports/         # Rapports et statistiques
```

## Fonctionnalités

### Tableau de Bord
- Vue d'ensemble des statistiques
- Indicateurs de performance
- Alertes de stock bas
- Activités récentes

### Gestion des Produits
- Liste des produits avec recherche et tri
- Ajout/Modification/Suppression de produits
- Gestion des stocks
- Alertes de stock minimum

### Gestion des Catégories
- Hiérarchie de catégories
- CRUD complet

### Gestion des Fournisseurs
- Liste des fournisseurs
- Informations de contact
- Historique des commandes

### Mouvements de Stock
- Entrées de stock
- Sorties de stock
- Ajustements
- Historique complet

### Rapports
- Rapports d'inventaire
- Analyses de stock
- Statistiques de mouvements

## Thème et Style

L'application utilise un thème personnalisé inspiré de Vex:

- **Couleur Primaire**: Bleu (#1e88e5)
- **Couleur Accent**: Rose (#e91e63)
- **Mode Clair/Sombre**: Switcher disponible dans le menu utilisateur
- **Design Responsive**: Compatible mobile et desktop

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# L'application sera accessible sur http://localhost:4200
```

## Scripts Disponibles

```bash
# Démarrage du serveur de développement
npm start

# Build de production
npm run build

# Tests unitaires
npm test

# Linting
npm run lint
```

## Configuration

Modifier le fichier `src/environments/environment.ts` pour configurer l'URL de l'API backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

## Composants Principaux

### Layout Component
Composant principal contenant:
- Toolbar avec navigation
- Sidebar avec menu
- Zone de contenu
- Switcher de thème

### Product List Component
- Table Material avec pagination
- Recherche en temps réel
- Tri par colonnes
- Actions (voir, éditer, supprimer)

### Dashboard Component
- Cartes de statistiques
- Graphiques (à implémenter)
- Activités récentes

## Services API

Tous les services héritent du `ApiService` et communiquent avec le backend Laravel:

- `ProductService` - CRUD produits
- `CategoryService` - CRUD catégories
- `SupplierService` - CRUD fournisseurs
- `StockMovementService` - Gestion des mouvements

## Modèles de Données

Les interfaces TypeScript définissent la structure des données:

- `Product` - Modèle produit complet
- `ProductCreateDto` - DTO pour création
- `ProductUpdateDto` - DTO pour mise à jour
- `Category`, `Supplier`, `StockMovement` - Autres entités

## Prochaines Étapes

1. Implémenter les formulaires de création/édition de produits
2. Ajouter les composants pour catégories et fournisseurs
3. Intégrer les graphiques avec ng2-charts
4. Ajouter l'authentification JWT
5. Implémenter les guards pour la protection des routes
6. Ajouter les interceptors pour la gestion des tokens
7. Améliorer la gestion des erreurs
8. Ajouter les tests unitaires et e2e

## Contribution

Ce projet suit les conventions Angular et utilise:
- Standalone components
- Signals pour la réactivité
- Lazy loading pour les routes
- Architecture modulaire

## Support

Pour toute question ou problème, veuillez créer une issue dans le repository.
