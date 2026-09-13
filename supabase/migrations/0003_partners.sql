-- ============================================================
-- Deliver'îles — Partenaires du bandeau défilant (page d'accueil)
-- À exécuter dans Supabase > SQL Editor.
-- Les partenaires sont gérés ici : INSERT / UPDATE / DELETE,
-- le bandeau de la landing page se met à jour à chaque chargement.
-- ============================================================

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  color text not null default '#0F172A', -- couleur du badge (identité : #0F172A navy / #0EA5E9 bleu / #F97316 orange)
  sort_order integer not null default 0, -- ordre d'affichage dans le bandeau
  is_active boolean not null default true, -- false = masqué du bandeau
  created_at timestamptz not null default now()
);

alter table partners enable row level security;

create policy "Les partenaires actifs sont visibles par tous"
  on partners for select
  using (is_active);

-- Écriture : via SQL Editor / Table Editor (service_role, RLS bypassé).
-- Aucune policy d'écriture pour les clients : le bandeau est piloté par l'équipe.

-- ---------- SEED (reprend les boutiques de démo actuelles) ----------
insert into partners (name, category, color, sort_order) values
  ('Le Fournil', 'Boulangerie', '#0F172A', 1),
  ('Marché Vert', 'Primeur', '#0EA5E9', 2),
  ('Café Lucie', 'Café', '#F97316', 3),
  ('Boucherie Martin', 'Boucherie', '#0F172A', 4),
  ('Fleuriste Iris', 'Fleuriste', '#0EA5E9', 5),
  ('La Mercerie', 'Loisirs créatifs', '#F97316', 6),
  ('Épicerie Bio', 'Épicerie', '#0F172A', 7),
  ('Poisson d''Avril', 'Poissonnerie', '#0EA5E9', 8);
