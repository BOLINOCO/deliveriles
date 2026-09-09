"use client";

export default function TrackingStatusBadge({ live }: { live: boolean }) {
  return (
    <p className="mt-2 text-center text-[0.68rem] font-semibold uppercase tracking-wide text-neutral-300">
      {live ? "Temps réel · Supabase" : "Mode démo — séquence simulée"}
    </p>
  );
}
