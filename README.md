# Deliver'îles

Marketplace locale nouvelle génération — PWA centrée sur l'IA et la transparence des prix.

L'app fonctionne en **deux modes**, sans changer une ligne de code :

| | Mode démo (défaut) | Mode connecté (Supabase configuré) |
|---|---|---|
| Auth | localStorage, email seul | Supabase Auth (email + mot de passe, cookies) |
| Données | `lib/mock-data.ts` | Tables Supabase (RLS activée) |
| Commandes | suivi simulé | RPC SQL atomique + suivi **Realtime** |
| Abonnements | bannières statiques | Stripe Checkout + webhook persistant |

## ✅ Fonctionnel

- **Acheteur** : accueil + recherche, fiche shop (produits réels ou mock), panier mono-boutique,
  commande validée **serveur** (POST /api/orders → RPC `place_order` atomique : décrément de stock,
  tarification serveur, création order + course), historique `/commandes`, suivi `/suivi/[id]`
  branché sur Supabase Realtime (polling de secours 15 s).
- **Vendeur** : dashboard (CA du mois réel, abonnement, stocks), gestion des stocks persistée
  (PATCH/POST serveur), éditeur de boutique persisté.
- **Livreur** : courses disponibles (RLS : courses `pending` + les siennes), acceptation atomique
  (premier arrivé, premier servi — impossible d'être assigné à deux), récupération → livraison avec
  preuve GPS, heartbeat géolocalisé (~4 s) visible par l'acheteur en temps réel, page gains réels
  sur 7 jours.
- **Abonnements** : Stripe Checkout (Vendeur 25 €/mois, Livreur Premium 10 €/mois) lié au profil
  connecté, webhook vérifié par signature + persistance `service_role` idempotente.
- **Assistant IA** (Claude, tool use) — nécessite `ANTHROPIC_API_KEY`.
- **Sécurité** : toute la logique d'autorisation est dans des RPC SQL `security definer`
  (supabase/migrations/0002) : le client ne peut jamais ni fixer un prix, ni progresser la course
  d'un autre, ni créer une commande sur le stock d'autrui. RLS activée sur toutes les tables.

## 🚀 Installation

```bash
npm install
cp .env.example .env.local   # puis renseignez vos clés (tout est optionnel : démo sinon)
npm run dev
```

| Route | Interface |
|---|---|
| `/` | Landing page |
| `/accueil` | Acheteur |
| `/dashboard` | Vendeur |
| `/courses` | Livreur |

## 🗄️ Supabase (activer le mode connecté)

1. Créez un projet sur [supabase.com](https://supabase.com), puis dans **SQL Editor**, exécutez
   dans l'ordre :
   - `supabase/migrations/0001_init.sql` — tables, enums, RLS de base
   - `supabase/migrations/0002_business_logic.sql` — RPC métier (`place_order`,
     `accept_delivery`, `update_delivery_progress`, `courier_heartbeat`…), Realtime
     (`orders` + `deliveries`), policies livreur
2. Copiez URL + anon key dans `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. (Webhook Stripe seulement) ajoutez `SUPABASE_SERVICE_ROLE_KEY` — **jamais** côté client.

> La migration 0002 reflète `lib/delivery-pricing.ts` côté SQL : les frais de livraison sont
> recalculés dans la base au moment de la commande (le client ne peut pas les influencer).

## 💳 Stripe

1. Créez deux Prices récurrents (25 € et 10 €/mois) et renseignez
   `STRIPE_PRICE_ID_VENDEUR` / `STRIPE_PRICE_ID_LIVREUR_PREMIUM`.
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook` en local, et copiez le secret
   dans `STRIPE_WEBHOOK_SECRET` (en prod : endpoint dans le Dashboard).
3. Événements attendus : `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`.

## Déploiement (Vercel)

1. Poussez le repo sur GitHub/GitLab, importez sur [vercel.com/new](https://vercel.com/new).
2. Ajoutez toutes les variables de `.env.example` que vous utilisez dans **Settings → Environment
   Variables** (attention : `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` restent côté serveur,
   sans préfixe `NEXT_PUBLIC_`).
3. Le webhook Stripe doit pointer vers `https://votre-domaine/api/stripe/webhook`.
4. Déployez — Next.js 15 est détecté automatiquement.

## Logique de prix (important)

Le prix final est **toujours recalculé côté serveur**, jamais confié à l'IA ni au client :
- Prix produit → 100% au vendeur (0% de commission dessus)
- Frais de livraison → `calculate_delivery_fee()` (SQL, miroir de `lib/delivery-pricing.ts`)
  selon distance / encombrement / conditions, répartis 80% livreur / 20% plateforme
- **Terrain (montées de Basse-Terre)** → la zone est déduite de l'adresse de livraison
  (`get_delivery_terrain()` en SQL, `getDeliveryTerrain()` en TS) et alourdit le kilomètre :
  | Zone | Exemples | Multiplicateur km |
  |---|---|---|
  | `PLATE` | Abymes, Gosier, Moule, Le Raizet… | ×1.00 |
  | `HILLY` | Basse-Terre ville, Petit-Bourg, Capesterre, Sainte-Rose… | ×1.15 |
  | `STEEP` | Saint-Claude/Matouba, Bouillante, Vieux-Habitants, Pointe-Noire, Trois-Rivières… | ×1.35 |

  Le bonus porte sur le kilomètre uniquement (pas sur la prise en charge de 2,50 €) —
  ex. 5 km en `STEEP` : `2,50 + 5 × 1,20 × 1,35 = 10,60 €` avant encombrement/conditions.
  La zone facturée est stockée sur la commande (`orders.terrain`) pour l'audit, et le client
  ne peut pas choisir sa zone : elle est recalculée serveur depuis l'adresse.
- Total affiché à l'acheteur = prix produit + frais de livraison totaux

## Prochaines étapes suggérées

1. Brancher une vraie carte (Mapbox GL) en remplaçant le rendu de `components/acheteur/live-map.tsx`
   — la position temps réel (`courier_lat/lng` + Realtime) est déjà en place.
2. Géocodage adresse → distance réelle + **altitude** (affiner la zone de relief avec
   `terrainFromAltitude()` au lieu de la simple recherche par commune ; `distanceKm` est
   actuellement de démo côté acheteur).
3. API météo pour `isRaining` (TODO dans `get_delivery_conditions()` et `getCurrentConditions()`).
4. Notifications push (Web Push + VAPID) aux livreurs à la création d'une course.
5. Paiement des commandes (Stripe PaymentIntent) en plus des abonnements.
