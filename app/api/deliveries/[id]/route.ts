import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function friendlyRpcError(message: string): { text: string; status: number } {
  if (message.includes("ALREADY_TAKEN")) {
    return { text: "Cette course vient d'être prise par un autre livreur.", status: 409 };
  }
  if (message.includes("NOT_A_COURIER")) {
    return { text: "Votre profil livreur n'est pas actif.", status: 403 };
  }
  if (message.includes("FORBIDDEN")) {
    return { text: "Vous n'êtes pas assigné à cette course.", status: 403 };
  }
  if (message.includes("AUTH_REQUIRED")) {
    return { text: "Connectez-vous pour effectuer cette action.", status: 401 };
  }
  if (message.includes("INVALID_STATUS_TRANSITION")) {
    return { text: "Transition de statut invalide.", status: 400 };
  }
  return { text: "Action impossible pour le moment.", status: 500 };
}

/**
 * POST /api/deliveries/:id — actions du livreur sur une course.
 * Body : { action: "accept" | "pickup" | "delivered" } ou
 *        { action: "heartbeat", lat: number, lng: number }.
 *
 * Toute la logique d'autorisation est dans les RPC SQL (security definer) :
 * seul le livreur assigné peut progresser, et l'acceptation est atomique
 * (premier arrivé, premier servi).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase n'est pas configuré (.env.local). Voir .env.example." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour accéder aux courses." }, { status: 401 });
  }

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Identifiant de course invalide." }, { status: 400 });
  }

  let body: { action?: unknown; lat?: unknown; lng?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const action = body.action;

  // ---- Acceptation de la course ----
  if (action === "accept") {
    const { error } = await supabase.rpc("accept_delivery", { p_delivery_id: id });
    if (error) {
      const mapped = friendlyRpcError(error.message ?? "");
      return NextResponse.json({ error: mapped.text }, { status: mapped.status });
    }
    return NextResponse.json({ ok: true, status: "accepted" });
  }

  // ---- Colis récupéré chez le vendeur ----
  if (action === "pickup") {
    const { error } = await supabase.rpc("update_delivery_progress", {
      p_delivery_id: id,
      p_status: "picked_up",
    });
    if (error) {
      const mapped = friendlyRpcError(error.message ?? "");
      return NextResponse.json({ error: mapped.text }, { status: mapped.status });
    }
    return NextResponse.json({ ok: true, status: "picked_up" });
  }

  // ---- Livraison confirmée ----
  if (action === "delivered") {
    const { error } = await supabase.rpc("update_delivery_progress", {
      p_delivery_id: id,
      p_status: "delivered",
    });
    if (error) {
      const mapped = friendlyRpcError(error.message ?? "");
      return NextResponse.json({ error: mapped.text }, { status: mapped.status });
    }
    return NextResponse.json({ ok: true, status: "delivered" });
  }

  // ---- Heartbeat GPS (position partagée à l'acheteur en temps réel) ----
  if (action === "heartbeat") {
    const lat = typeof body.lat === "number" ? body.lat : Number.NaN;
    const lng = typeof body.lng === "number" ? body.lng : Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ error: "Coordonnées GPS invalides." }, { status: 400 });
    }
    const { error } = await supabase.rpc("courier_heartbeat", {
      p_delivery_id: id,
      p_lat: lat,
      p_lng: lng,
    });
    if (error) {
      const mapped = friendlyRpcError(error.message ?? "");
      return NextResponse.json({ error: mapped.text }, { status: mapped.status });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Action inconnue. Attendu : accept, pickup, delivered ou heartbeat." },
    { status: 400 }
  );
}
