import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getSupabaseServerClient } from "@/lib/supabase/server";

// Deux plans possibles : abonnement Vendeur (25€/mois, 0% commission produit)
// et abonnement Livreur Premium (10€/mois, priorité sur les courses).
const PRICE_IDS: Record<"vendeur" | "livreur_premium", string | undefined> = {
  vendeur: process.env.STRIPE_PRICE_ID_VENDEUR,
  livreur_premium: process.env.STRIPE_PRICE_ID_LIVREUR_PREMIUM,
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY manquante. Ajoutez-la dans .env.local (voir .env.example)." },
      { status: 500 }
    );
  }

  let body: { plan?: "vendeur" | "livreur_premium" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "vendeur" && plan !== "livreur_premium") {
    return NextResponse.json({ error: "Le champ 'plan' doit être 'vendeur' ou 'livreur_premium'." }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID manquant pour le plan '${plan}'. Renseignez-le dans .env.local.` },
      { status: 500 }
    );
  }

  // Le client Stripe accepte un apiVersion figé : la typologie des objets
  // reste stable même si Stripe publie une nouvelle version d'API.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  // Lien session ↔ profil : le webhook retrouvera l'utilisateur via
  // client_reference_id (id du profil Supabase), sans jamais faire confiance
  // à un metadata forgé côté client.
  let profileId: string | null = null;
  let customerEmail: string | undefined = undefined;
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      profileId = user.id;
      customerEmail = user.email ?? undefined;
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/${plan === "vendeur" ? "dashboard" : "gains"}?abonnement=succes`,
      cancel_url: `${origin}/${plan === "vendeur" ? "dashboard" : "gains"}?abonnement=annule`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      ...(profileId
        ? {
            client_reference_id: profileId,
            metadata: { plan, profile_id: profileId },
            subscription_data: { metadata: { plan, profile_id: profileId } },
          }
        : { metadata: { plan } }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Erreur Stripe Checkout:", err);
    return NextResponse.json({ error: "Impossible de créer la session de paiement." }, { status: 502 });
  }
}
