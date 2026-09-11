import { PRODUCTS, CURRENT_VENDOR_SHOP_ID } from "@/lib/mock-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import StockTable from "@/components/vendeur/stock-table";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StocksPage() {
  const configured = isSupabaseConfigured();
  let products: Product[] = PRODUCTS.filter((p) => p.shopId === CURRENT_VENDOR_SHOP_ID);
  let shopId = CURRENT_VENDOR_SHOP_ID;
  let demo = true;
  let notice =
    "Mode démo : les modifications sont locales. Renseignez Supabase dans .env.local pour la persistance.";

  if (configured) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();

    if (user) {
      const { data: shop } = await supabase!
        .from("shops")
        .select("id, products ( * )")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shop) {
        shopId = shop.id;
        demo = false;
        notice = "Les modifications sont enregistrées dans votre boutique Supabase.";
        products = (shop.products ?? []).map((p) => ({
          id: p.id,
          shopId: p.shop_id,
          name: p.name,
          price: Number(p.price),
          unit: p.unit ?? undefined,
          stock: Number(p.stock),
        }));
      } else {
        notice = "Aucune boutique associée à votre compte — créez-en une depuis votre profil.";
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-black">Gestion des stocks</h1>
        <p className="mt-1 text-sm text-neutral-400">{notice}</p>
      </div>
      <StockTable initialProducts={products} shopId={shopId} demo={demo} />
    </div>
  );
}
