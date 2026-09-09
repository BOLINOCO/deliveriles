import { Suspense } from "react";
import ShopGrid from "@/components/acheteur/shop-grid";

export default function AccueilPage() {
  return (
    <div className="px-4 pb-6">
      <h1 className="mb-4 mt-2 text-xl font-extrabold text-black">Vos commerçants à proximité</h1>
      <Suspense fallback={<p className="py-16 text-center text-sm text-neutral-400">Chargement…</p>}>
        <ShopGrid />
      </Suspense>
    </div>
  );
}
