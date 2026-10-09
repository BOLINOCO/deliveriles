"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SHOPS as DEMO_SHOPS } from "@/lib/mock-data";
import type { Shop } from "@/lib/types";

export default function ShopGrid() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  // Catalogue dynamique : /api/shops renvoie les boutiques réelles (SQL).
  // Fallback : les boutiques de démo (comportement d'avant le branchement).
  const [shops, setShops] = useState<Shop[]>(DEMO_SHOPS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/shops");
        if (res.status === 503) return; // Supabase non configuré → démo
        if (!res.ok) return;
        const data = (await res.json()) as { shops?: Shop[] };
        if (!cancelled && data.shops && data.shops.length > 0) setShops(data.shops);
      } catch {
        // réseau indisponible → on garde le fallback démo silencieusement
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = query
    ? shops.filter(
        (s) => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)
      )
    : shops;

  if (filtered.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-400">
        Aucun shop ne correspond à « {query} ».
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {filtered.map((shop) => (
        <Link
          key={shop.id}
          href={`/shop/${shop.slug}`}
          className="rounded-2xl border border-neutral-200 bg-white p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)]"
        >
          <div className="mb-2.5 h-20 rounded-xl" style={{ background: shop.color }} />
          <p className="text-sm font-extrabold text-black">{shop.name}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {shop.category} · ⭐ {shop.rating}
          </p>
        </Link>
      ))}
    </div>
  );
}
