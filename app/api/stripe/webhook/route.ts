import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getSupabaseAdminClient } from "@/lib/supabase";

/**
 * Webhook Stripe — serveur uniquement.
 *
 * La persistance passe par le client service_role (contourne la RLS, sinon
 * impossible depuis un contexte serveur sans session utilisateur).
 * Toutes les écritures sont idempotentes (upsert sur stripe_subscription_id).
 */
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET manquante. Voir .env.example." },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY manquante — impossible de persister l'abonnement." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("En-tête stripe-signature manquant.");
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Signature Stripe invalide:", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // profil retrouvé via client_reference_id (posé côté checkout, jamais forgé côté client)
      const profileId = session.client_reference_id ?? session.metadata?.profile_id;
      const plan = session.metadata?.plan;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (!profileId || !plan || !subscriptionId) {
        console.error("checkout.session.completed incomplet:", {
          profileId,
          plan,
          subscriptionId,
        });
        break;
      }

      // Récupère current_period_end depuis l'abonnement Stripe.
      let periodEnd: string | null = null;
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        periodEnd = new Date(sub.current_period_end * 1000).toISOString();
      } catch (err) {
        console.error("retrieve subscription échoué:", err);
      }

      const { error } = await supabase.from("subscriptions").upsert(
        {
          profile_id: profileId,
          type: plan === "vendeur" ? "vendeur" : "livreur_premium",
          stripe_subscription_id: subscriptionId,
          status: "active",
          current_period_end: periodEnd,
        },
        { onConflict: "stripe_subscription_id" }
      );

      if (error) {
        console.error("Upsert subscription échoué:", error);
        return NextResponse.json({ error: "Erreur base de données." }, { status: 500 });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: subscription.status, // active | past_due | canceled | unpaid…
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Update subscription échoué:", error);
        return NextResponse.json({ error: "Erreur base de données." }, { status: 500 });
      }
      break;
    }

    default:
      // Événements non gérés — acquittés volontairement pour éviter les retries.
      break;
  }

  return NextResponse.json({ received: true });
}
