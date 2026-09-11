import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  calculateDeliveryFee,
  getCurrentConditions,
  getDeliveryTerrain,
} from "@/lib/delivery-pricing";

/**
 * GET /api/deliveries — courses visibles par le livreur connecté :
 *  - toutes les courses `pending` (RLS 0002 : réservée aux profils is_courier)
 *  - ses propres courses non terminées (acceptées / en cours)
 * Les gains sont recalculés serveur (même moteur que l'acheteur).
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
    return NextResponse.json({ error: "Connectez-vous pour voir les courses." }, { status: 401 });
  }

  // `shops` n'est joignable que via orders (FK orders.shop_id → shops) :
  // il n'existe aucune FK directe deliveries → shops (schéma 0001).
  const { data: deliveries, error } = await supabase
    .from("deliveries")
    .select(
      "id, order_id, status, courier_id, driver_earnings, created_at, orders ( delivery_address, distance_km, cart_size, subtotal, shops ( name, color ), order_items ( product_name, quantity ) )"
    )
    .or(`status.eq.pending,courier_id.eq.${user.id}`)
    .order("created_at", { ascending: true })
    .limit(30);

  if (error) {
    console.error("Erreur lecture courses:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  const courses = (deliveries ?? []).map((row) => {
    const order = row.orders as unknown as {
      delivery_address: string;
      distance_km: number;
      cart_size: string;
      subtotal: number;
      shops: { name: string; color: string } | null;
      order_items: { product_name: string; quantity: number }[] | null;
    } | null;

    const items = order?.order_items ?? [];

    // Les gains sont figés en base au moment du place_order (calculate_delivery_fee
    // SQL) ; le recalcul local n'est qu'un filet si la colonne manque.
    const driverEarnings =
      row.driver_earnings != null
        ? Number(row.driver_earnings)
        : calculateDeliveryFee(
            Number(order?.distance_km ?? 0),
            (order?.cart_size as "SMALL" | "MEDIUM" | "LARGE") ?? "SMALL",
            getCurrentConditions(),
            getDeliveryTerrain(order?.delivery_address ?? "")
          ).driverEarnings;

    return {
      id: row.id,
      orderId: row.order_id,
      status: row.status,
      isMine: row.courier_id === user.id,
      shopName: order?.shops?.name ?? "Boutique",
      shopColor: order?.shops?.color ?? "#0F172A",
      buyerAddress: order?.delivery_address ?? "",
      distanceKm: Number(order?.distance_km ?? 0),
      cartSize: order?.cart_size ?? "SMALL",
      itemsSummary: items.map((i) => `${i.quantity} ${i.product_name}`).join(", "),
      driverEarnings,
    };
  });

  return NextResponse.json({ courses });
}
