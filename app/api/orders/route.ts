import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { cartSizeFromQuantity } from "@/lib/delivery-pricing";

type IncomingItem = { productId?: unknown; quantity?: unknown };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/orders — historique des commandes de l'acheteur connecté.
 * La policy RLS (0001) garantit que seules ses propres commandes sont retournées.
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

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, status, total, created_at, order_items ( product_name, quantity )"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erreur lecture commandes:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ orders });
}

/**
 * POST /api/orders — création d'une commande.
 *
 * Le client n'envoie que { shopId, deliveryAddress, distanceKm, items }.
 * AUCUN montant n'est accepté du client : les prix sont relus en base et les
 * frais de livraison recalculés serveur (lib/delivery-pricing), puis la RPC
 * SQL `place_order` refait vérification + décrément de stock + création de la
 * commande + course livreur, atomiquement.
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase n'est pas configuré (.env.local). Voir .env.example." },
      { status: 503 }
    );
  }

  // 1. Authentification (cookie de session Supabase Auth).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour commander." }, { status: 401 });
  }

  // 2. Validation du corps de requête.
  let body: {
    shopId?: unknown;
    deliveryAddress?: unknown;
    distanceKm?: unknown;
    items?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const shopId = typeof body.shopId === "string" ? body.shopId : "";
  const deliveryAddress =
    typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
  const distanceKm = typeof body.distanceKm === "number" ? body.distanceKm : Number.NaN;

  if (!isUuid(shopId)) {
    return NextResponse.json({ error: "Identifiant de boutique invalide." }, { status: 400 });
  }
  if (deliveryAddress.length < 5 || deliveryAddress.length > 300) {
    return NextResponse.json(
      { error: "Adresse de livraison manquante ou invalide." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 100) {
    return NextResponse.json({ error: "Distance de livraison invalide." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return NextResponse.json({ error: "Panier vide ou invalide." }, { status: 400 });
  }

  // 3. Normalisation des items : quantités entières ≥ 1 et ≤ 99, IDs uuid.
  const items: { product_id: string; quantity: number }[] = [];
  for (const raw of body.items as IncomingItem[]) {
    const productId = typeof raw?.productId === "string" ? raw.productId : "";
    const quantity = typeof raw?.quantity === "number" ? Math.floor(raw.quantity) : 0;
    if (!isUuid(productId) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: "Ligne de panier invalide." }, { status: 400 });
    }
    items.push({ product_id: productId, quantity });
  }

  // 4. Les produits appartiennent-ils tous à la boutique demandée ?
  //    (empêche un panier forgé mélangeant plusieurs shops / produits inconnus)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, shop_id, price, stock")
    .in("id", items.map((i) => i.product_id));

  if (productsError) {
    console.error("Erreur lecture produits:", productsError);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  for (const item of items) {
    const product = products?.find((p) => p.id === item.product_id);
    if (!product || product.shop_id !== shopId) {
      return NextResponse.json(
        { error: "Un produit du panier n'appartient pas à cette boutique." },
        { status: 400 }
      );
    }
    if (Number(product.stock) < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuffisant pour ce produit (${item.product_id}).` },
        { status: 409 }
      );
    }
  }

  // 5. Exécution de la transaction SQL (prix/frais recalculés en base).
  const { data: orderId, error: rpcError } = await supabase.rpc("place_order", {
    p_shop_id: shopId,
    p_delivery_address: deliveryAddress,
    p_distance_km: distanceKm,
    p_items: JSON.stringify(items),
    p_cart_size: cartSizeFromQuantity(totalQuantity),
  });

  if (rpcError || !orderId) {
    const reason = typeof rpcError?.message === "string" ? rpcError.message : "";
    const friendly =
      reason.includes("STOCK_INSUFFICIENT")
        ? "Le stock vient de changer — réessayez après avoir ajusté votre panier."
        : reason.includes("INVALID_QUANTITY")
          ? "Une quantité du panier est invalide."
          : reason.includes("INVALID_ADDRESS")
          ? "Adresse de livraison invalide."
          : reason.includes("CART_SIZE_MISMATCH")
            ? "Panier incohérent — rechargez la page et réessayez."
            : "Impossible d'enregistrer la commande.";
    console.error("Erreur place_order:", rpcError?.message);
    return NextResponse.json({ error: friendly }, { status: 409 });
  }

  // 6. Redirection vers le suivi temps réel.
  return NextResponse.json({ orderId }, { status: 201 });
}
