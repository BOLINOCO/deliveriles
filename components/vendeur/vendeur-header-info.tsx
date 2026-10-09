"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { SHOPS, CURRENT_VENDOR_SHOP_ID } from "@/lib/mock-data";
import type { Shop } from "@/lib/types";

const DEMO_SHOP = SHOPS.find((s) => s.id === CURRENT_VENDOR_SHOP_ID)!;

/**
 * Info boutique dans le header vendeur.
 * Connecté : GET /api/shop renvoie la vraie boutique (RLS).
 * Sinon : demo (comportement d'origine).
 */
export default function VendeurHeaderInfo() {
  const { account } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/shop");
        if (res.status === 503 || res.status === 401) return; // démo / déconnecté
        if (!res.ok) return;
        const data = (await res.json()) as { shop?: (Shop & { color: string }) | null };
        if (!cancelled && data.shop) {
          setShop({
            id: data.shop.id,
            slug: data.shop.slug,
            name: data.shop.name,
            category: data.shop.category,
            rating: Number(data.shop.rating),
            color: data.shop.color ?? "#0F172A",
            distanceKm: Number((data.shop as unknown as { distance_km?: number }).distance_km ?? 0),
          });
        }
      } catch {
        // réseau indisponible → fallback démo
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isSeller = account?.roles.isSeller ?? false;
  const shopName = shop?.name ?? (isSeller ? account?.shopName || DEMO_SHOP.name : DEMO_SHOP.name);
  const shopColor = shop?.color ?? DEMO_SHOP.color;

  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 flex-shrink-0 rounded-xl" style={{ background: shopColor }} />
      <div>
        <p className="text-sm font-extrabold text-black">{shopName}</p>
        <p className="text-xs text-neutral-400">
          {isSeller ? `Espace vendeur — ${account?.name}` : "Espace vendeur (démo)"}
        </p>
      </div>
    </div>
  );
}
