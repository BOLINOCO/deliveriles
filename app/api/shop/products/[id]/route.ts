import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/shop/products/:id — mise à jour d'un produit (prix, stock, nom…).
 * Le filtre `shop_id in (select id from shops where owner_id = auth.uid())`
 * est appliqué à la fois par la policy RLS (0001) et par la requête ci-dessous.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Identifiant de produit invalide." }, { status: 400 });
  }

  let body: { name?: unknown; price?: unknown; stock?: unknown; unit?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const patch: Record<string, string | number> = {};
  if (typeof body.name === "string" && body.name.trim().length > 0 && body.name.length <= 120) {
    patch.name = body.name.trim();
  }
  if (typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0 && body.price <= 10000) {
    patch.price = body.price;
  }
  if (typeof body.stock === "number" && Number.isInteger(body.stock) && body.stock >= 0 && body.stock <= 100000) {
    patch.stock = body.stock;
  }
  if (typeof body.unit === "string" && body.unit.trim().length > 0 && body.unit.length <= 30) {
    patch.unit = body.unit.trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide à mettre à jour." }, { status: 400 });
  }

  // Jointure de propriété : on ne met à jour que les produits d'une boutique
  // appartenant au vendeur connecté (défense en profondeur au-delà de la RLS).
  const { data: ownedShop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!ownedShop) {
    return NextResponse.json({ error: "Aucune boutique associée à votre compte." }, { status: 404 });
  }

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("shop_id", ownedShop.id);

  if (error) {
    console.error("Erreur update produit:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le produit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/shop/products/:id — retrait du catalogue.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Identifiant de produit invalide." }, { status: 400 });
  }

  const { data: ownedShop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!ownedShop) {
    return NextResponse.json({ error: "Aucune boutique associée à votre compte." }, { status: 404 });
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("shop_id", ownedShop.id);

  if (error) {
    console.error("Erreur suppression produit:", error);
    return NextResponse.json({ error: "Impossible de supprimer le produit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
