"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export type TrackingState = {
  orderStatus: string | null;
  deliveryStatus: string | null;
  courierName: string | null;
  courierLat: number | null;
  courierLng: number | null;
  /** true si les données viennent d'un channel Realtime actif, false en mode démo */
  live: boolean;
};

const DEMO_SEQUENCE = ["preparing", "ready", "delivering", "delivered"] as const;

/**
 * Suivi temps réel d'une commande, du point de vue acheteur.
 *
 * Branché : souscrit aux changes Supabase Realtime sur `orders` et `deliveries`
 * (publication configurée en migration 0002) et raffraîchit le détail via
 * GET /api/orders/:id.
 * Non branché : rejoue une séquence simulée pour que l'UI reste démontrable.
 */
export function useOrderTracking(orderId: string): TrackingState {
  const [state, setState] = useState<TrackingState>({
    orderStatus: null,
    deliveryStatus: null,
    courierName: null,
    courierLat: null,
    courierLng: null,
    live: false,
  });
  const demoStepRef = useRef(0);

  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  const deliveryIdRef = useRef<string | null>(null);

  const isDemo = useMemo(() => !isSupabaseConfigured() || orderId === "demo", [orderId]);

  useEffect(() => {
    if (isDemo) {
      // Séquence de démonstration, comme avant le branchement.
      setState((s) => ({ ...s, live: false }));
      const interval = setInterval(() => {
        const step = DEMO_SEQUENCE[demoStepRef.current % DEMO_SEQUENCE.length];
        demoStepRef.current += 1;
        setState((s) => ({
          ...s,
          orderStatus: step,
          deliveryStatus: step === "delivered" ? "delivered" : step === "delivering" ? "picked_up" : "accepted",
          live: false,
        }));
      }, 4000);
      return () => clearInterval(interval);
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    async function fetchOnce() {
      try {
        const res = await fetch(`/api/orders/${orderIdRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        deliveryIdRef.current = data.delivery?.id ?? deliveryIdRef.current;
        setState((s) => ({
          ...s,
          orderStatus: data.order?.status ?? s.orderStatus,
          deliveryStatus: data.delivery?.status ?? s.deliveryStatus,
          courierName: data.delivery?.profiles?.full_name ?? s.courierName,
          courierLat: data.delivery?.courier_lat ?? s.courierLat,
          courierLng: data.delivery?.courier_lng ?? s.courierLng,
          live: true,
        }));
      } catch {
        // réseau instable : on garde l'état courant, le prochain event réessaiera
      }
    }

    void fetchOnce();

    // Realtime : tout change sur cette commande / cette livraison re-déclenche le
    // fetch. Filtre sur l'id de livraison dès qu'on le connaît (évite de capter
    // les updates des courses des autres livreurs).
    const channel = supabase
      .channel(`order-tracking-${orderIdRef.current}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderIdRef.current}` },
        () => void fetchOnce()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        (change) => {
          if (
            deliveryIdRef.current === null ||
            (change as { new?: { id?: string } }).new?.id === deliveryIdRef.current
          ) {
            void fetchOnce();
          }
        }
      )
      .subscribe();

    // Filet de sécurité : polling léger toutes les 15s si Realtime est coupé.
    const poll = setInterval(() => void fetchOnce(), 15_000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [isDemo]);

  return state;
}
