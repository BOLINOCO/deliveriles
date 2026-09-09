import { SHOPS, CURRENT_VENDOR_SHOP_ID } from "@/lib/mock-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import ShopEditorForm from "@/components/vendeur/shop-editor-form";
import type { Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopEditeurPage() {
  const configured = isSupabaseConfigured();
  let shop: Shop = SHOPS.find((s) => s.id === CURRENT_VENDOR_SHOP_ID)!;
  let demo = true;

  if (configured) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();

    if (user) {
      const { data: dbShop } = await supabase!
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (dbShop) {
        demo = false;
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
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-black">Ma boutique</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Personnalisez la page publique que voient vos acheteurs.
        </p>
      </div>
      <ShopEditorForm shop={shop} demo={demo} />
    </div>
  );
}
