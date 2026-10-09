import VendeurTabs from "@/components/vendeur/vendeur-tabs";
import VendeurHeaderInfo from "@/components/vendeur/vendeur-header-info";
import VendeurShopLink from "@/components/vendeur/vendeur-shop-link";

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <VendeurHeaderInfo />
          <div className="flex items-center gap-2">
            <VendeurShopLink />
          </div>
        </div>
        <VendeurTabs />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
