import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SHOPS, PRODUCTS } from "@/lib/mock-data";
import { computeOrderTotal } from "@/lib/pricing";
import type { ComposedOrder } from "@/lib/types";

const COMPOSER_TOOL = {
  name: "composer_panier",
  description:
    "Compose une commande structurée à partir de la demande en langage naturel de l'acheteur, en piochant uniquement dans le catalogue fourni dans le system prompt.",
  input_schema: {
    type: "object" as const,
    properties: {
      shop_slug: {
        type: "string",
        description: "Slug du shop choisi, obligatoirement tiré du catalogue fourni.",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            product_id: {
              type: "string",
              description: "Identifiant du produit, obligatoirement tiré du catalogue fourni.",
            },
            quantite: { type: "number", description: "Quantité commandée." },
          },
          required: ["product_id", "quantite"],
        },
      },
      creneau_livraison: {
        type: "string",
        description: "Créneau ou heure de livraison souhaité si mentionné, ex: \"7h45\".",
      },
    },
    required: ["shop_slug", "items"],
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante. Ajoutez-la dans .env.local (voir .env.example)." },
      { status: 500 }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Le champ 'message' est requis." }, { status: 400 });
  }

  const catalog = SHOPS.map((shop) => ({
    slug: shop.slug,
    name: shop.name,
    products: PRODUCTS.filter((p) => p.shopId === shop.id).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
    })),
  }));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `Tu es l'assistant de commande de Deliver'îles, une marketplace locale. Compose la commande de l'acheteur en appelant l'outil "composer_panier", en choisissant uniquement des produits et un shop présents dans ce catalogue JSON :\n\n${JSON.stringify(
        catalog
      )}\n\nSi la demande est ambiguë (shop non précisé, produit introuvable), choisis l'interprétation la plus raisonnable parmi le catalogue.`,
      tools: [COMPOSER_TOOL],
      tool_choice: { type: "tool", name: "composer_panier" },
      messages: [{ role: "user", content: message }],
    });
  } catch (err) {
    console.error("Erreur API Anthropic:", err);
    return NextResponse.json({ error: "L'assistant IA est momentanément indisponible." }, { status: 502 });
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "L'assistant n'a pas pu composer de commande." }, { status: 422 });
  }

  const input = toolUse.input as {
    shop_slug: string;
    items: { product_id: string; quantite: number }[];
    creneau_livraison?: string;
  };

  const shop = SHOPS.find((s) => s.slug === input.shop_slug);
  if (!shop) {
    return NextResponse.json({ error: `Shop introuvable dans le catalogue : ${input.shop_slug}` }, { status: 422 });
  }

  const items = input.items
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.product_id && p.shopId === shop.id);
      if (!product || item.quantite <= 0) return null;
      return {
        productId: product.id,
        shopId: shop.id,
        name: product.name,
        quantity: item.quantite,
        unitPrice: product.price,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  if (items.length === 0) {
    return NextResponse.json({ error: "Aucun produit reconnu dans la demande." }, { status: 422 });
  }

  // Le total est toujours recalculé côté serveur à partir du catalogue —
  // jamais confié au modèle, qui ne sert qu'à interpréter la demande.
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const pricing = computeOrderTotal(subtotal, shop.distanceKm, totalQuantity);

  const summary = `${items.map((i) => `${i.quantity} ${i.name}`).join(", ")} — ${shop.name}${
    input.creneau_livraison ? `, livraison ${input.creneau_livraison}` : ""
  }.`;

  const order: ComposedOrder = {
    shopSlug: shop.slug,
    shopName: shop.name,
    items,
    deliverySlot: input.creneau_livraison,
    summary,
    pricing,
  };

  return NextResponse.json(order);
}
