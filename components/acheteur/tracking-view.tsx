"use client";

import LiveMap from "./live-map";
import TrackingStatusBadge from "./tracking-status-badge";
import { useOrderTracking } from "./use-order-tracking";

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Commande enregistrée",
  preparing: "En préparation",
  ready: "Prête — en attente du livreur",
  delivering: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

/**
 * Carte + état de suivi, alimentés par Supabase Realtime (ou la séquence démo).
 * Client component autonome : les Server Components ne peuvent pas leur passer
 * des fonctions en props, d'où ce composant autonome plutôt qu'une render-prop.
 */
export default function TrackingView({ commandeId }: { commandeId: string }) {
  const tracking = useOrderTracking(commandeId);

  return (
    <>
      <LiveMap
        statusLabel={ORDER_STATUS_LABEL[tracking.orderStatus ?? "pending"] ?? "Livreur en route"}
        etaMinutes={tracking.deliveryStatus === "delivered" ? 0 : undefined}
      />
      <TrackingStatusBadge live={tracking.live} />
    </>
  );
}
