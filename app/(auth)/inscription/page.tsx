"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { RoleToggleCard } from "@/components/auth/role-toggle-card";

const ICON_ACHETEUR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l1.5 4M18 2l-1.5 4M3.5 9h17l-1.6 9.5a2 2 0 01-2 1.5H7.1a2 2 0 01-2-1.5L3.5 9z" />
  </svg>
);
const ICON_VENDEUR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M4 9h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V9z" />
    <path d="M9 13a3 3 0 006 0" />
  </svg>
);
const ICON_LIVREUR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M6 18h6l3-8h3M9 10H6l-1 3" />
    <path d="M13 6h3l2 4" />
  </svg>
);

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("role") ?? "";
  const { signUp } = useAuth();

  const [isSeller, setIsSeller] = useState(preselect.includes("vendeur"));
  const [isCourier, setIsCourier] = useState(preselect.includes("livreur"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || password.length < 6) {
      setError("Merci de renseigner un nom, un email et un mot de passe d'au moins 6 caractères.");
      return;
    }
    if (isSeller && !shopName) {
      setError("Merci de renseigner le nom de votre boutique.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const account = await signUp({
        name,
        email,
        password,
        roles: { isSeller, isCourier },
        shopName: isSeller ? shopName : undefined,
        shopCategory: isSeller ? shopCategory : undefined,
      });

      // Supabase a exigé une confirmation email : pas de session tant que
      // l'utilisateur n'a pas cliqué sur le lien reçu.
      if (!account) {
        setError("Compte créé ! Confirmez votre email (lien reçu par mail) avant de vous connecter.");
        return;
      }

      if (account.roles.isSeller) router.push("/dashboard");
      else if (account.roles.isCourier) router.push("/courses");
      else router.push("/accueil");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-bold text-black">
          Qu&apos;est-ce que vous voulez faire sur Deliver&apos;îles ?
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RoleToggleCard
            title="Acheteur"
            description="Commandez chez tous les commerçants locaux partenaires."
            icon={ICON_ACHETEUR}
            active
            alwaysOn
          />
          <RoleToggleCard
            title="Vendeur"
            description="Ouvrez votre shop et gérez vos stocks. 0% de commission produit."
            icon={ICON_VENDEUR}
            active={isSeller}
            onToggle={() => setIsSeller((s) => !s)}
          />
          <RoleToggleCard
            title="Livreur"
            description="Acceptez des courses, touchez 80% des frais de livraison."
            icon={ICON_LIVREUR}
            active={isCourier}
            onToggle={() => setIsCourier((c) => !c)}
          />
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Vous pouvez cocher plusieurs cases — un vendeur ou un livreur reste toujours acheteur aussi.
        </p>
      </div>

      {isSeller && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Nom de votre boutique"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <input
            value={shopCategory}
            onChange={(e) => setShopCategory(e.target.value)}
            placeholder="Catégorie (ex : Boulangerie)"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom complet"
          className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Mot de passe"
          className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-navy py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-blue disabled:opacity-60"
      >
        {submitting ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-neutral-400">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-bold text-brand-blue hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export default function InscriptionPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-black">Créer un compte</h1>
      <p className="mb-6 text-sm text-neutral-400">Un seul compte pour acheter, vendre et livrer.</p>
      <Suspense fallback={<p className="text-sm text-neutral-400">Chargement…</p>}>
        <InscriptionForm />
      </Suspense>
    </div>
  );
}
