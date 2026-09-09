"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { isSupabaseConfigured } from "@/lib/supabase";

type OrderRow = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { orders?: OrderRow[] };
        if (!cancelled) setOrders(data.orders ?? []);
      } catch {
        if (!cancelled) setOrders([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured]);

  if (!configured) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-neutral-400">
            <rect x="4" y="7" width="16" height="14" rx="2" />
            <path d="M8 7V5a4 4 0 018 0v2" />
          </svg>
        </div>
        <h1 className="text-lg font-extrabold text-black">Aucune commande pour l&apos;instant</h1>
        <p className="max-w-xs text-sm text-neutral-400">
          Vos commandes passées et en cours apparaîtront ici, avec leur suivi en temps réel.
        </p>
      </div>
    );
  }

  if (orders === null) {
    return <p className="py-16 text-center text-sm text-neutral-400">Chargement…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-lg font-extrabold text-black">Aucune commande pour l&apos;instant</h1>
        <Link
          href="/accueil"
          className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-blue"
        >
          Découvrir les shops
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/suivi/${order.id}`}
          className="rounded-2xl border border-neutral-200 p-4 transition hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-black">
                {order.order_items?.map((i) => `${i.quantity}× ${i.product_name}`).join(", ") ||
                  "Commande"}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">{formatDateTime(order.created_at)}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-bold text-black">{Number(order.total).toFixed(2)} €</p>
              <p
                className={`mt-0.5 text-xs font-semibold ${
                  order.status === "delivered"
                    ? "text-brand-green"
                    : order.status === "cancelled"
                      ? "text-red-400"
                      : "text-neutral-500"
                }`}
              >
                {STATUS_LABEL[order.status] ?? order.status}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
