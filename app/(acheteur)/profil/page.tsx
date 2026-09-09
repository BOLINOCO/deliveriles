"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";

function RoleBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        active ? "bg-brand-blue-soft text-brand-blue" : "bg-neutral-100 text-neutral-400"
      }`}
    >
      {label}
    </span>
  );
}

function ActivateCourier() {
  const { activateRole } = useAuth();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        activateRole("isCourier");
        setDone(true);
      }}
      disabled={done}
      className="flex-shrink-0 rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue disabled:opacity-50"
    >
      {done ? "Activé ✓" : "Devenir livreur"}
    </button>
  );
}

function ActivateSeller() {
  const { activateRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState("");
  const [done, setDone] = useState(false);

  function handleConfirm(e: FormEvent) {
    e.preventDefault();
    if (!shopName) return;
    activateRole("isSeller", { shopName, shopCategory });
    setDone(true);
  }

  if (done) return <span className="flex-shrink-0 text-xs font-bold text-brand-green">Activé ✓</span>;


  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue"
      >
        Devenir vendeur
      </button>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="flex flex-col gap-2">
      <input
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        placeholder="Nom de votre boutique"
        className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-blue"
      />
      <input
        value={shopCategory}
        onChange={(e) => setShopCategory(e.target.value)}
        placeholder="Catégorie"
        className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-blue"
      />
      <button type="submit" disabled={!shopName} className="rounded-full bg-brand-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
        Confirmer
      </button>
    </form>
  );
}

export default function ProfilPage() {
  const { account, isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return <div className="px-4 py-16 text-center text-sm text-neutral-400">Chargement…</div>;
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-neutral-400">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
          </svg>
        </div>
        <h1 className="text-lg font-extrabold text-black">Vous n&apos;êtes pas connecté</h1>
        <p className="max-w-xs text-sm text-neutral-400">
          Créez un compte pour gérer vos commandes, ou activer l&apos;espace vendeur ou livreur.
        </p>
        <div className="flex gap-3">
          <Link href="/connexion" className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-bold text-black hover:bg-neutral-50">
            Se connecter
          </Link>
          <Link href="/inscription" className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white">
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-4 py-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-lg font-extrabold text-white">
          {account.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-extrabold text-black">{account.name}</p>
          <p className="text-xs text-neutral-400">{account.email}</p>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <RoleBadge label="Acheteur" active />
        <RoleBadge label="Vendeur" active={account.roles.isSeller} />
        <RoleBadge label="Livreur" active={account.roles.isCourier} />
      </div>

      <ul className="mt-5 divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        <li className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <p className="text-sm font-bold text-black">Espace vendeur</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {account.roles.isSeller ? account.shopName : "0% de commission sur vos ventes."}
            </p>
          </div>
          {account.roles.isSeller ? (
            <Link href="/dashboard" className="flex-shrink-0 rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-black hover:bg-neutral-50">
              Ouvrir
            </Link>
          ) : (
            <ActivateSeller />
          )}
        </li>
        <li className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <p className="text-sm font-bold text-black">Espace livreur</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {account.roles.isCourier ? "Actif" : "Touchez 80% des frais de livraison."}
            </p>
          </div>
          {account.roles.isCourier ? (
            <Link href="/courses" className="flex-shrink-0 rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-black hover:bg-neutral-50">
              Ouvrir
            </Link>
          ) : (
            <ActivateCourier />
          )}
        </li>
      </ul>

      <button
        type="button"
        onClick={signOut}
        className="mt-6 w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-black hover:bg-neutral-50"
      >
        Se déconnecter
      </button>
    </div>
  );
}
