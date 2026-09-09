"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

export default function ConnexionPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const account = await signIn({ email, password });
      if (!account) {
        setError("Connexion impossible. Vérifiez vos identifiants.");
        return;
      }
      if (account.roles.isSeller) router.push("/dashboard");
      else if (account.roles.isCourier) router.push("/courses");
      else router.push("/accueil");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-black">Se connecter</h1>
      <p className="mb-6 text-sm text-neutral-400">
        {`Un compte pour acheter, vendre et livrer. ${
          process.env.NEXT_PUBLIC_SUPABASE_URL
            ? "Authentification sécurisée via Supabase."
            : "Mode démo : la connexion se fait par email, sur cet appareil."
        }`}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          required
          className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-navy py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-blue disabled:opacity-60"
        >
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-400">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-bold text-brand-blue hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
