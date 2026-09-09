"use client";

import { useAuth } from "@/components/auth/auth-context";

export default function LivreurHeaderInfo() {
  const { account } = useAuth();
  const name = account?.roles.isCourier ? account.name : "Marie";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-sm font-extrabold text-white">
        {name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-extrabold text-black">{name}</p>
        <p className="text-xs text-neutral-400">
          {account?.roles.isCourier ? "Espace livreur" : "Espace livreur (démo)"}
        </p>
      </div>
    </div>
  );
}
