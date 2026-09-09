"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "./cart-context";
import { useAuth } from "@/components/auth/auth-context";
import {
  getCurrentConditions,
  getDeliveryTerrain,
  TERRAIN_ZONES,
} from "@/lib/delivery-pricing";
import { computeOrderTotal } from "@/lib/pricing";

type PlaceOrderResponse = { orderId?: string; error?: string };

const DEMO_DISTANCE_KM = 2.5;

export default function PlaceOrderButton({ shopId }: { shopId: string }) {
  const { items, subtotal, clear, count } = useCart();
  const { account } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estimation locale (affichage uniquement) : la facturation réelle est
  // recalculée serveur (RPC place_order), y compris la zone de relief.
  const estimate = useMemo(() => {
    if (address.trim().length < 5 || items.length === 0) return null;
    const terrain = getDeliveryTerrain(address);
    const pricing = computeOrderTotal(
      subtotal,
      DEMO_DISTANCE_KM,
      count,
      getCurrentConditions(),
      address
    );
    return { terrain, pricing };
  }, [address, items.length, subtotal, count]);

  async function handleOrder() {
    if (submitting) return;

    if (!account) {
      router.push("/connexion");
      return;
    }
    if (address.trim().length < 5) {
      setError("Merci de saisir une adresse de livraison complète.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          deliveryAddress: address.trim(),
          // Distance de démonstration — sera fournie par le géocodage
          // (adresse → km boutique/client) quand il sera branché.
          distanceKm: DEMO_DISTANCE_KM,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });

      // Mode démo (Supabase non configuré) : on simule une commande réussie
      // et on redirige vers un suivi simulé, comme avant le branchement.
      if (res.status === 503) {
        clear();
        router.push("/suivi/demo");
        return;
      }

      const data = (await res.json()) as PlaceOrderResponse;
      if (!res.ok || !data.orderId) {
        throw new Error(data.error ?? "Impossible d'enregistrer la commande.");
      }

      clear();
      router.push(`/suivi/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Votre adresse de livraison"
        aria-label="Adresse de livraison"
        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
      />

      {estimate && (
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 text-xs">
          <span className="text-neutral-500">
            Zone :{" "}
            <span className="font-bold text-black">
              {TERRAIN_ZONES[estimate.terrain].label}
            </span>
            {estimate.terrain !== "PLATE" && (
              <span className="ml-1 text-brand-blue">
                (montée Basse-Terre, km ×
                {TERRAIN_ZONES[estimate.terrain].distanceMultiplier})
              </span>
            )}
          </span>
          <span className="font-extrabold text-black">
            ≈ {estimate.pricing.total.toFixed(2)} €
          </span>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="button"
        onClick={handleOrder}
        disabled={submitting || items.length === 0}
        className="w-full rounded-full bg-brand-orange py-4 text-sm font-bold text-white transition hover:bg-brand-orange-deep disabled:opacity-60"
      >
        {submitting ? "Enregistrement…" : "Commander"}
      </button>
    </div>
  );
}
