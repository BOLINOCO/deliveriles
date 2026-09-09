import Link from "next/link";
import { SHOPS, CURRENT_VENDOR_SHOP_ID } from "@/lib/mock-data";
import VendeurTabs from "@/components/vendeur/vendeur-tabs";
import VendeurHeaderInfo from "@/components/vendeur/vendeur-header-info";

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  const shop = SHOPS.find((s) => s.id === CURRENT_VENDOR_SHOP_ID)!;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <VendeurHeaderInfo />
          <div className="flex items-center gap-2">
            <Link href="/accueil" className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-black hover:bg-neutral-50">
              Espace acheteur
            </Link>
            <Link href={`/shop/${shop.slug}`} className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-black hover:bg-neutral-50">
              Voir mon shop public
            </Link>
          </div>
        </div>
        <VendeurTabs />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
