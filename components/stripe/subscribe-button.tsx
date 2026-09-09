"use client";

import { useState } from "react";

/**
 * Bouton d'abonnement → Stripe Checkout (POST /api/stripe/checkout).
 * Affiche l'erreur retournée par la route si Stripe n'est pas configuré.
 */
export default function SubscribeButton({
  plan,
  label = "S'abonner",
  className,
}: {
  plan: "vendeur" | "livreur_premium";
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Paiement indisponible.");
    } catch {
      setError("Paiement indisponible pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "mt-4 w-full rounded-full bg-brand-orange py-3 text-sm font-bold text-white hover:bg-brand-orange-deep disabled:opacity-60"
        }
      >
        {loading ? "Redirection…" : label}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
