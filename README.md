# LogiTrack Nodes Viewer

Application React pour visualiser les **nœuds** du système LogiTrack (Suivi Logistique et Chaîne d'approvisionnement).

Les nœuds correspondent aux **terminaux** et **appareils** du système distribué :
- **Fournisseurs** (suppliers) — nœuds de la chaîne d'approvisionnement
- **Entrepôts** (warehouses) — nœuds de stockage et distribution
- **Livreurs** (delivery agents) — nœuds mobiles (terminaux de livraison)

## Prérequis

- Node.js 18+
- Projet Supabase LogiTrack configuré (même base que l'app Flutter)

## Installation

```bash
cd nodes-viewer
npm install
```

## Configuration

1. Copiez `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```

2. Remplissez les variables dans `.env` avec vos identifiants Supabase :
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_anon_key
   ```

   (Les mêmes valeurs que dans `lib/main.dart` de l'app Flutter.)

## Lancement

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans le navigateur.

## Build

```bash
npm run build
```

Les fichiers de production sont générés dans `dist/`.

## Structure

```
nodes-viewer/
├── src/
│   ├── api/nodesApi.js    # Appels Supabase (suppliers, warehouses, delivery_agents)
│   ├── components/        # Composants réutilisables
│   ├── lib/supabase.js    # Client Supabase
│   ├── pages/             # Pages (Dashboard, détails par nœud)
│   ├── App.jsx
│   └── main.jsx
├── .env.example
└── README.md
```

## Fonctionnalités

- **Tableau de bord** : liste de tous les nœuds (fournisseurs, entrepôts, livreurs)
- **Détail fournisseur** : nom, adresse, note, colis associés
- **Détail entrepôt** : capacité, taux d'occupation, zones
- **Détail livreur** : statut, véhicule, livraisons

L'app utilise la même base Supabase que l'application Flutter LogiTrack.
