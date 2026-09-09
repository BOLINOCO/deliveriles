"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCourses } from "./use-courses";

export default function MarkAsDeliveredButton({ courseId }: { courseId: string }) {
  const { markDelivered, markPickedUp, demo, sendHeartbeat } = useCourses();
  const [delivered, setDelivered] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    if (pending || delivered) return;
    setPending(true);
    setError(null);

    try {
      // Position GPS au moment de la preuve de livraison (best effort, non bloquant).
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => void sendHeartbeat(courseId, pos.coords.latitude, pos.coords.longitude),
          () => undefined,
          { enableHighAccuracy: true, timeout: 4000 }
        );
      }

      if (demo) {
        // Parcours de démonstration inchangé (sans base de données).
        await markDelivered(courseId);
        setDelivered(true);
        setTimeout(() => router.push("/courses"), 1200);
        return;
      }

      // Sécurité : si la course n'avait pas été marquée « récupérée », on le fait
      // implicitement avant la livraison (la RPC exige un livreur assigné).
      // Les hooks retournent false (au lieu de throw) en cas d'échec — on les
      // vérifie pour ne jamais afficher « Livrée ✓ » à tort.
      const pickedUp = await markPickedUp(courseId);
      if (!pickedUp) {
        setError("Impossible de marquer la course comme récupérée.");
        setPending(false);
        return;
      }
      const ok = await markDelivered(courseId);
      if (!ok) {
        setError("Impossible de valider la livraison.");
        setPending(false);
        return;
      }

      setDelivered(true);
      setTimeout(() => router.push("/courses"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de valider la livraison.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || delivered}
        className="w-full rounded-full bg-brand-orange py-4 text-sm font-bold text-white transition hover:bg-brand-orange-deep disabled:opacity-60"
      >
        {delivered
          ? "Livrée ✓ — retour aux courses…"
          : pending
            ? "Validation…"
            : "Marquer comme livrée"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
