import { notFound } from "next/navigation";

import { SHOPS, PRODUCTS } from "@/lib/mock-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import ProductList from "@/components/acheteur/product-list";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let shop = SHOPS.find((s) => s.slug === slug) ?? null;
  let products: Product[] = shop ? PRODUCTS.filter((p) => p.shopId === shop!.id) : [];

  // Données réelles quand Supabase est configuré : le shop et ses produits
  // viennent de la base (ids uuid attendus par /api/orders).
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data: dbShop } = await supabase
        .from("shops")
        .select("id, slug, name, category, description, color, rating, distance_km")
        .eq("slug", slug)
        .maybeSingle();

      if (dbShop) {
        shop = {
          id: dbShop.id,
          slug: dbShop.slug,
          name: dbShop.name,
          category: dbShop.category,
          rating: Number(dbShop.rating),
          color: dbShop.color,
          distanceKm: Number(dbShop.distance_km ?? 0),
          description: dbShop.description ?? undefined,
        };

        const { data: dbProducts } = await supabase
          .from("products")
          .select("id, shop_id, name, price, unit, stock")
          .eq("shop_id", dbShop.id)
          .order("created_at", { ascending: true });

        products = (dbProducts ?? []).map((p) => ({
          id: p.id,
          shopId: p.shop_id,
          name: p.name,
          price: Number(p.price),
          unit: p.unit ?? undefined,
          stock: Number(p.stock),
        }));
      }
    }
  }

  if (!shop) notFound();

  return (
    <div className="px-4 pb-6">
      <div className="mb-4 mt-2 h-28 rounded-2xl" style={{ background: shop.color }} />
      <h1 className="text-xl font-extrabold text-black">{shop.name}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        {shop.category} · ⭐ {shop.rating}
      </p>
      <ProductList products={products} />
    </div>
  );
}
