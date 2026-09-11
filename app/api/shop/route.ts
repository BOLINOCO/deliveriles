import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/shop — la boutique du vendeur connecté + ses produits.
 * La RLS (0001) garantit que seules SES données sont accessibles.
 */
export async function GET() {
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

  const { data: shop } = await supabase
    .from("shops")
    .select("*, products ( * )")
    .eq("owner_id", user.id)
    .maybeSingle();

  return NextResponse.json({ shop });
}

/**
 * PATCH /api/shop — mise à jour de la boutique du vendeur connecté.
 * Champs modifiables : name, category, description, color.
 */
export async function PATCH(req: NextRequest) {
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

  let body: {
    name?: unknown;
    category?: unknown;
    description?: unknown;
    color?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  // Construction d'un patch whitelisté — jamais de spread du body.
  const patch: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim().length > 0 && body.name.length <= 120) {
    patch.name = body.name.trim();
  }
  if (typeof body.category === "string" && body.category.trim().length > 0 && body.category.length <= 80) {
    patch.category = body.category.trim();
  }
  if (typeof body.description === "string" && body.description.length <= 500) {
    patch.description = body.description.trim();
  }
  if (
    typeof body.color === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.color)
  ) {
    patch.color = body.color;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide à mettre à jour." }, { status: 400 });
  }

  const { error } = await supabase
    .from("shops")
    .update(patch)
    .eq("owner_id", user.id); // RLS + filtre owner : jamais la boutique d'un autre

  if (error) {
    console.error("Erreur update shop:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer la boutique." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/shop — création d'un produit dans la boutique du vendeur connecté.
 */
export async function POST(req: NextRequest) {
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

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) {
    return NextResponse.json({ error: "Aucune boutique associée à votre compte." }, { status: 404 });
  }

  let body: { name?: unknown; price?: unknown; stock?: unknown; unit?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number.NaN;
  const stock = typeof body.stock === "number" ? Math.floor(body.stock) : Number.NaN;
  const unit = typeof body.unit === "string" ? body.unit.trim().slice(0, 30) : null;

  if (name.length === 0 || name.length > 120) {
    return NextResponse.json({ error: "Nom de produit invalide." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0 || price > 10000) {
    return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return NextResponse.json({ error: "Stock invalide." }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({ shop_id: shop.id, name, price, stock, unit })
    .select()
    .single();

  if (error) {
    console.error("Erreur création produit:", error);
    return NextResponse.json({ error: "Impossible de créer le produit." }, { status: 500 });
  }

  return NextResponse.json({ product }, { status: 201 });
}
