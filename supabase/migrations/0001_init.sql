-- ============================================================
-- Deliver'îles — Schéma initial Supabase
-- À exécuter dans Supabase > SQL Editor sur un projet existant.
-- Ce fichier n'est PAS exécuté automatiquement par l'application.
-- ============================================================

-- ---------- ENUMS ----------
create type order_status as enum ('pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled');
create type delivery_status as enum ('pending', 'accepted', 'picked_up', 'delivered');
create type subscription_type as enum ('vendeur', 'livreur_premium');
create type cart_size as enum ('SMALL', 'MEDIUM', 'LARGE');

-- ---------- PROFILES ----------
-- Étend auth.users. Chaque utilisateur est acheteur par défaut ;
-- is_seller / is_courier reflètent le choix fait à l'inscription
-- ("Vendeur & Acheteur" vs "Acheteur uniquement") + l'inscription livreur séparée.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_seller boolean not null default false,
  is_courier boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Les profils sont visibles par tous les utilisateurs connectés"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Un utilisateur peut modifier son propre profil"
  on profiles for update
  using (auth.uid() = id);

-- ---------- SHOPS ----------
create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  slug text not null unique,
  name text not null,
  category text not null,
  description text,   color text not null default '#0F172A',
  rating numeric(2, 1) not null default 5.0,
  distance_km numeric(5, 2), -- calculée dynamiquement en prod (position shop vs acheteur), stockée ici pour le MVP
  created_at timestamptz not null default now()
);

alter table shops enable row level security;

create policy "Les shops sont visibles par tous"
  on shops for select
  using (true);

create policy "Le propriétaire peut gérer son shop"
  on shops for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------- PRODUCTS ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  unit text,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "Les produits sont visibles par tous"
  on products for select
  using (true);

create policy "Le propriétaire du shop peut gérer ses produits"
  on products for all
  using (auth.uid() = (select owner_id from shops where shops.id = products.shop_id))
  with check (auth.uid() = (select owner_id from shops where shops.id = products.shop_id));

-- ---------- ORDERS ----------
-- Prix transparent : subtotal (produit, 100% au vendeur) + delivery_fee (80% livreur)
-- + platform_commission (20% sur la livraison uniquement — 0% sur le produit).
create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles (id),
  shop_id uuid not null references shops (id),
  status order_status not null default 'pending',
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null,       -- part reversée au livreur (80%)
  platform_commission numeric(10, 2) not null, -- part plateforme sur la livraison (20%)
  total numeric(10, 2) not null,
  delivery_address text not null,
  distance_km numeric(5, 2) not null,
  cart_size cart_size not null,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

create policy "L'acheteur et le vendeur voient leurs commandes"
  on orders for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = (select owner_id from shops where shops.id = orders.shop_id)
  );

create policy "L'acheteur crée ses commandes"
  on orders for insert
  with check (auth.uid() = buyer_id);

-- ---------- ORDER ITEMS ----------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id),
  product_name text not null, -- snapshot au moment de la commande
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null
);

alter table order_items enable row level security;

create policy "Visible par les parties de la commande associée"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and (
        auth.uid() = orders.buyer_id
        or auth.uid() = (select owner_id from shops where shops.id = orders.shop_id)
      )
    )
  );

-- ---------- DELIVERIES ----------
-- Une ligne par commande une fois qu'un livreur est assigné.
-- courier_lat / courier_lng alimentés en continu par l'app livreur
-- et diffusés en temps réel via Supabase Realtime (postgres_changes) au front acheteur.
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade,
  courier_id uuid references profiles (id),
  status delivery_status not null default 'pending',
  driver_earnings numeric(10, 2) not null,
  platform_commission numeric(10, 2) not null,
  courier_lat double precision,
  courier_lng double precision,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table deliveries enable row level security;

create policy "Visible par l'acheteur, le vendeur et le livreur assigné"
  on deliveries for select
  using (
    auth.uid() = courier_id
    or exists (
      select 1 from orders
      where orders.id = deliveries.order_id
      and (
        auth.uid() = orders.buyer_id
        or auth.uid() = (select owner_id from shops where shops.id = orders.shop_id)
      )
    )
  );

create policy "Un livreur peut accepter une course en attente"
  on deliveries for update
  using (status = 'pending' or auth.uid() = courier_id)
  with check (auth.uid() = courier_id);

-- ---------- SUBSCRIPTIONS ----------
-- Abonnement Vendeur (25€/mois, 0% commission produit) et Livreur Premium (10€/mois, priorité).
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  type subscription_type not null,
  stripe_subscription_id text unique,
  status text not null default 'inactive', -- 'active' | 'past_due' | 'canceled' ... (miroir des statuts Stripe)
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Un utilisateur voit son propre abonnement"
  on subscriptions for select
  using (auth.uid() = profile_id);

-- ---------- INDEX UTILES ----------
create index idx_products_shop_id on products (shop_id);
create index idx_orders_buyer_id on orders (buyer_id);
create index idx_orders_shop_id on orders (shop_id);
create index idx_deliveries_courier_id on deliveries (courier_id);
create index idx_shops_slug on shops (slug);
