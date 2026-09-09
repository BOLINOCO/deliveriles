-- ============================================================
-- Deliver'îles — Migration 0002 : logique métier (RPC, Realtime, RLS)
-- À exécuter dans Supabase > SQL Editor, APRÈS 0001_init.sql.
-- ============================================================

-- ---------- 1. REALTIME ----------
-- Diffusion temps réel des statuts de commande et positions livreur
-- vers l'acheteur (suivi) et le livreur (courses disponibles).
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table deliveries;

alter table orders replica identity full;
alter table deliveries replica identity full;

-- ---------- 2. TERRAIN (montées de Basse-Terre) ----------
-- Colonne d'audit sur la commande : quelle zone de relief a été facturée.
alter table orders add column if not exists terrain text not null default 'PLATE';

-- ---------- 2bis. HELPERS DE TARIFICATION (miroir de lib/delivery-pricing.ts) ----------
-- Zone de relief déduite de l'adresse (miroir exact de lib/delivery-pricing.ts).
-- Normalisation sans extension : lower + translate (accents retirés).
create or replace function get_delivery_terrain(p_address text)
returns text
language sql
stable
as $$
  with normalized as (
    select translate(lower(coalesce(p_address, '')),
      'àâéèêëîïôöûüç', 'aaeeeeiiouuuc'
    ) as addr
  ),
  communes(zone, tags) as (
    values
      ('STEEP', array['saint-claude', 'matouba', 'bouillante', 'vieux-habitants',
                      'pointe-noire', 'trois-rivieres', 'deshaies', 'baillif', 'gourbeyre']),
      ('HILLY', array['basse-terre', 'capesterre', 'petit-bourg', 'sainte-rose', 'goyave'])
  )
  select coalesce(
    (select c.zone
       from communes c
      where exists (
        select 1 from unnest(c.tags) as t(tag)
         where position(t.tag in (select addr from normalized)) > 0
      )
      order by case c.zone when 'STEEP' then 0 else 1 end
      limit 1),
    'PLATE'
  );
$$;

create or replace function calculate_delivery_fee(
  p_distance_km numeric,
  p_cart_size cart_size,
  p_conditions jsonb,
  p_terrain text default 'PLATE'
) returns table (total_customer_fee numeric, driver_earnings numeric, platform_commission numeric, terrain text)
language sql
stable
as $$
  with zone as (
    select
      case p_terrain when 'HILLY' then 1.15 when 'STEEP' then 1.35 else 1.0 end as terrain_mult,
      case p_terrain when 'HILLY' then 'HILLY' when 'STEEP' then 'STEEP' else 'PLATE' end as terrain_zone
  ),
  fee as (
    select
      -- Bonus montée : porte sur le kilomètre, pas sur la prise en charge.
      (2.5 + p_distance_km * 1.2 * zone.terrain_mult)
      * case p_cart_size when 'SMALL' then 1.0 when 'MEDIUM' then 1.25 else 1.5 end
      + (coalesce((p_conditions->>'isRaining')::boolean, false)::int
         + coalesce((p_conditions->>'isNight')::boolean, false)::int
         + coalesce((p_conditions->>'isHighDemand')::boolean, false)::int) * 1.5
      as raw_fee,
      zone.terrain_zone
    from zone
  )
  select
    round(raw_fee::numeric, 2),
    round((round(raw_fee::numeric, 2) * 0.8)::numeric, 2),
    round((round(raw_fee::numeric, 2) * 0.2)::numeric, 2),
    terrain_zone
  from fee;
$$;

create or replace function get_delivery_conditions()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'isRaining', false, -- TODO : brancher une API météo (ex. OpenWeather)
    'isNight', extract(hour from now() at time zone 'utc')::int >= 21
               or extract(hour from now() at time zone 'utc')::int < 7,
    'isHighDemand',
    extract(hour from now() at time zone 'utc')::int between 12 and 13
    or extract(hour from now() at time zone 'utc')::int between 19 and 20
  );
$$;

-- ---------- 3. RPC : CRÉATION DE COMMANDE (atomique) ----------
-- Appelée par /api/orders avec les args validés côté serveur.
-- En UNE transaction : décrément du stock + création order + order_items
-- + row deliveries 'pending'. Si le stock est insuffisant, l'exception
-- stoppe TOUTE la transaction (pas de commande fantôme, pas de stock négatif).
create or replace function place_order(
  p_shop_id uuid,
  p_delivery_address text,
  p_distance_km numeric,
  p_items jsonb, -- [{ "product_id": uuid, "quantity": int }]
  p_cart_size cart_size
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_unit_price numeric;
  v_product_name text;
  v_subtotal numeric := 0;
  v_total_qty int := 0;
  v_terrain text;
  v_fees record;
begin
  if v_buyer_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  if p_delivery_address is null or length(btrim(p_delivery_address)) < 5 then
    raise exception 'INVALID_ADDRESS';
  end if;

  if p_distance_km is null or p_distance_km <= 0 or p_distance_km > 100 then
    raise exception 'INVALID_DISTANCE';
  end if;

  -- 1. Vérification du stock + prix serveur = seule source de vérité.
  --    Tri par product_id pour un ordre de verrouillage déterministe (anti-deadlock).
  --    Alias de colonne explicite e(item) : référence non ambiguë dans la boucle.
  for v_item in
    select e.item
    from jsonb_array_elements(p_items) as e(item)
    order by e.item->>'product_id'
  loop
    -- Garde-fou quantité (le cast ::int peut lui-même lever data_exception
    -- sur un nombre malformé : on l'encadre).
    begin
      if (v_item->>'quantity')::int < 1 or (v_item->>'quantity')::int > 99 then
        raise exception 'INVALID_QUANTITY';
      end if;
    exception when data_exception then
      raise exception 'INVALID_QUANTITY';
    end;

    begin
      update products
         set stock = stock - (v_item->>'quantity')::int
       where id = (v_item->>'product_id')::uuid
         and shop_id = p_shop_id
         and stock >= (v_item->>'quantity')::int
      returning price, name into v_unit_price, v_product_name;

      if not found then
        raise exception 'STOCK_INSUFFICIENT';
      end if;
    exception when data_exception then
      raise exception 'STOCK_INSUFFICIENT';
    end;

    v_subtotal := v_subtotal + v_unit_price * (v_item->>'quantity')::int;
    v_total_qty := v_total_qty + (v_item->>'quantity')::int;
  end loop;

  -- Cohérence : la taille du panier est dérivée de la quantité réelle commandée
  -- (miroir de cartSizeFromQuantity côté app).
  if not (
    (v_total_qty <= 3 and p_cart_size = 'SMALL')
    or (v_total_qty between 4 and 8 and p_cart_size = 'MEDIUM')
    or (v_total_qty >= 9 and p_cart_size = 'LARGE')
  ) then
    raise exception 'CART_SIZE_MISMATCH';
  end if;

  -- 2. Frais de livraison recalculés côté base (jamais confiés au client).
  --    La zone de relief (montées Basse-Terre) est déduite de l'adresse : le
  --    client ne peut jamais choisir sa zone.
  v_terrain := get_delivery_terrain(btrim(p_delivery_address));
  select * into v_fees from calculate_delivery_fee(
    p_distance_km, p_cart_size, get_delivery_conditions(), v_terrain
  );

  -- 3. Création de la commande.
  insert into orders (
    id, buyer_id, shop_id, status,
    subtotal, delivery_fee, platform_commission, total,
    delivery_address, distance_km, cart_size, terrain
  ) values (
    v_order_id, v_buyer_id, p_shop_id, 'pending',
    round(v_subtotal::numeric, 2), v_fees.driver_earnings, v_fees.platform_commission,
    round((v_subtotal + v_fees.total_customer_fee)::numeric, 2),
    btrim(p_delivery_address), p_distance_km, p_cart_size, v_terrain
  );

  -- 4. Lignes de commande (snapshot nom + prix au moment de l'achat).
  insert into order_items (order_id, product_id, product_name, quantity, unit_price)
  select
    v_order_id,
    (e.item->>'product_id')::uuid,
    p.name,
    (e.item->>'quantity')::int,
    p.price
  from jsonb_array_elements(p_items) as e(item)
  join products p on p.id = (e.item->>'product_id')::uuid;

  -- 5. Course 'pending' créée immédiatement : visible des livreurs sans délai.
  --    driver_earnings / platform_commission sont NOT NULL sans défaut (0001).
  insert into deliveries (order_id, status, driver_earnings, platform_commission)
  values (v_order_id, 'pending', v_fees.driver_earnings, v_fees.platform_commission);

  return v_order_id;
end;
$$;

-- ---------- 4. TRIGGER : annulation → restock automatique ----------
-- (drop if exists : la migration peut être rejouée sans erreur)
create or replace function restock_on_cancellation()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update products p
       set stock = p.stock + oi.quantity
      from order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_restock_on_cancellation on orders;
create trigger trg_restock_on_cancellation
  after update on orders
  for each row
  execute function restock_on_cancellation();

-- ---------- 5. RPC : AVANCÉE DE COMMANDE (vendeur) ----------
create or replace function set_order_status(p_order_id uuid, p_status order_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Seul le vendeur propriétaire peut préparer / rendre prête / annuler.
  -- La transition 'delivered' passe exclusivement par les RPC livreur.
  if p_status not in ('preparing', 'ready', 'cancelled') then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  if not exists (
    select 1 from orders o
    join shops s on s.id = o.shop_id
    where o.id = p_order_id and s.owner_id = auth.uid()
  ) then
    raise exception 'FORBIDDEN';
  end if;

  update orders set status = p_status where id = p_order_id;
end;
$$;

-- ---------- 6. RPC : COURSE LIVREUR ----------
-- Acceptation : premier arrivé, premier servi, sans double assignation.
create or replace function accept_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier uuid := auth.uid();
  v_order_id uuid;
begin
  if v_courier is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Le profil doit être marqué livreur (garde applicative + RLS).
  if not exists (select 1 from profiles where id = v_courier and is_courier = true) then
    raise exception 'NOT_A_COURIER';
  end if;

  -- Mise à jour conditionnelle : une seule transaction gagne, les autres
  -- concurrentes voient 0 ligne (pas de double assignation possible).
  update deliveries
     set courier_id = v_courier,
         status = 'accepted',
         accepted_at = now()
   where id = p_delivery_id
     and status = 'pending'
     and courier_id is null;

  if not found then
    raise exception 'ALREADY_TAKEN';
  end if;

  select order_id into v_order_id from deliveries where id = p_delivery_id;
  update orders set status = 'delivering' where id = v_order_id;
end;
$$;

-- Progression : 'picked_up' puis 'delivered' — uniquement par le livreur assigné.
create or replace function update_delivery_progress(
  p_delivery_id uuid,
  p_status delivery_status
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier uuid := auth.uid();
  v_order_id uuid;
  v_current delivery_status;
begin
  if v_courier is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_status not in ('accepted', 'picked_up', 'delivered') then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  select order_id, status into v_order_id, v_current from deliveries
    where id = p_delivery_id and courier_id = v_courier;

  if v_order_id is null then
    raise exception 'FORBIDDEN'; -- pas le livreur assigné
  end if;

  -- Idempotence : rejouer la même transition est un succès sans effet
  -- (réseau instable / double clic sur « Marquer comme livré »).
  if v_current = p_status then
    return;
  end if;

  -- Transitions strictement avant : pas de retour arrière (delivered → picked_up…).
  if p_status = 'picked_up' and v_current <> 'accepted' then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;
  if p_status = 'delivered' and v_current not in ('accepted', 'picked_up') then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  update deliveries
     set status = p_status,
         picked_up_at = case when p_status = 'picked_up' then now() else picked_up_at end,
         delivered_at = case when p_status = 'delivered' then now() else delivered_at end
   where id = p_delivery_id;

  if p_status = 'delivered' then
    update orders set status = 'delivered' where id = v_order_id;
  end if;
end;
$$;

-- Heartbeat GPS du livreur : upsert de la position (throttlé côté client à ~4s).
create or replace function courier_heartbeat(
  p_delivery_id uuid,
  p_lat double precision,
  p_lng double precision
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  update deliveries
     set courier_lat = p_lat,
         courier_lng = p_lng
   where id = p_delivery_id
     and courier_id = auth.uid()
     and status in ('accepted', 'picked_up');
end;
$$;

-- ---------- 7. RLS LIVREURS ----------
-- Les livreurs voient les courses en attente + leurs propres courses.
drop policy if exists "Les livreurs voient les courses en attente" on deliveries;
create policy "Les livreurs voient les courses en attente"
  on deliveries for select
  using (
    (status = 'pending' and exists (
      select 1 from profiles where profiles.id = auth.uid() and is_courier = true
    ))
    or auth.uid() = courier_id
  );

-- ---------- 8. PROFILES : création à l'inscription ----------
-- 0001 n'autorise que select/update sur profiles : sans cette policy,
-- l'upsert du profil (inscription / activation de rôle) échoue en RLS.
drop policy if exists "Un utilisateur peut créer son propre profil" on profiles;
create policy "Un utilisateur peut créer son propre profil"
  on profiles for insert
  with check (auth.uid() = id);

-- ---------- 9. ABONNEMENTS ----------
-- Le webhook Stripe passe par le service_role, qui contourne déjà la RLS :
-- aucune policy d'écriture n'est donc ajoutée ici. La table reste en lecture
-- pour le propriétaire uniquement (policy 0001), ce qui est suffisant.
