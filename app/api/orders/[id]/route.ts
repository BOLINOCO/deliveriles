import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/orders/:id — détail d'une commande pour le suivi acheteur.
 * La RLS (policy 0001) garantit que seul l'acheteur de la commande (ou le
 * vendeur du shop) peut la lire — on ne revalide donc pas manuellement ici.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal, delivery_fee, platform_commission, total, delivery_address, created_at, order_items ( product_name, quantity, unit_price )"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  const { data: delivery } = await supabase
    .from("deliveries")
    .select(
      "id, status, courier_lat, courier_lng, accepted_at, picked_up_at, delivered_at, profiles ( full_name )"
    )
    .eq("order_id", id)
    .maybeSingle();

  return NextResponse.json({ order, delivery });
}
