"use client";

import { useAuth } from "@/components/auth/auth-context";
import { SHOPS, CURRENT_VENDOR_SHOP_ID } from "@/lib/mock-data";

export default function VendeurHeaderInfo() {
  const { account } = useAuth();
  const demoShop = SHOPS.find((s) => s.id === CURRENT_VENDOR_SHOP_ID)!;
  const shopName = account?.roles.isSeller ? account.shopName || demoShop.name : demoShop.name;

  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 flex-shrink-0 rounded-xl" style={{ background: demoShop.color }} />
      <div>
        <p className="text-sm font-extrabold text-black">{shopName}</p>
        <p className="text-xs text-neutral-400">
          {account?.roles.isSeller ? `Espace vendeur — ${account.name}` : "Espace vendeur (démo)"}
        </p>
      </div>
    </div>
  );
}
