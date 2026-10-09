"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SHOPS, CURRENT_VENDOR_SHOP_ID } from "@/lib/mock-data";

const DEMO_SLUG = SHOPS.find((s) => s.id === CURRENT_VENDOR_SHOP_ID)!.slug;

/**
 * Lien « Voir mon shop public » du header vendeur.
 * Connecté : le slug vient de la vraie boutique (/api/shop).
 * Démo / déconnecté : slug de la boutique de démo (comportement d'origine).
 */
export default function VendeurShopLink() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/shop");
        if (res.status === 503 || res.status === 401) return;
        if (!res.ok) return;
        const data = (await res.json()) as { shop?: { slug: string } | null };
        if (!cancelled && data.shop?.slug) setSlug(data.shop.slug);
      } catch {
        // réseau indisponible → fallback démo
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href={`/shop/${slug ?? DEMO_SLUG}`}
      className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-black hover:bg-neutral-50"
    >
      Voir mon shop public
    </Link>
  );
}
