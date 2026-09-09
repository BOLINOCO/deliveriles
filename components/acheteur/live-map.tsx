"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

// Trajet de démonstration (coordonnées en % sur la carte).
// En production : positions réelles via Supabase Realtime + rendu Mapbox.
const WAYPOINTS = [
  { x: 15, y: 78 },
  { x: 38, y: 55 },
  { x: 58, y: 62 },
  { x: 85, y: 22 },
];

const DEFAULT_STATUS_LABEL = "Livreur en route";

type LiveMapProps = {
  statusLabel?: string;
  etaMinutes?: number;
};

export default function LiveMap({ statusLabel = DEFAULT_STATUS_LABEL, etaMinutes }: LiveMapProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [eta, setEta] = useState(12);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const marker = markerRef.current;
    if (reduceMotion || !marker) return;

    const timeline = anime.timeline({
      loop: true,
      direction: "alternate",
      easing: "easeInOutSine",
    });
    WAYPOINTS.forEach((point, i) => {
      if (i === 0) return;
      timeline.add({
        targets: marker,
        left: `${point.x}%`,
        top: `${point.y}%`,
        duration: 2200,
      });
    });

    const etaInterval = setInterval(() => {
      setEta((e) => (e > 2 ? e - 1 : 12));
    }, 3000);

    return () => clearInterval(etaInterval);
  }, []);

  const start = WAYPOINTS[0];
  const end = WAYPOINTS[WAYPOINTS.length - 1];
  const pathD = `M ${WAYPOINTS.map((p) => `${p.x} ${p.y}`).join(" L ")}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
      <div className="relative aspect-[4/3] w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 18} x2="100" y2={i * 18} stroke="#E7E7E7" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 18} y1="0" x2={i * 18} y2="100" stroke="#E7E7E7" strokeWidth={0.5} />
          ))}
          <path d={pathD} fill="none" stroke="#0EA5E9" strokeWidth={1.4} strokeDasharray="3 3" strokeLinecap="round" />
        </svg>

        <div
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-brand-navy text-white shadow-md"
          style={{ left: `${start.x}%`, top: `${start.y}%` }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
            <path d="M3 9l1.5-5h15L21 9" />
            <path d="M4 9h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V9z" />
          </svg>
        </div>

        <div
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-brand-orange text-white shadow-md"
          style={{ left: `${end.x}%`, top: `${end.y}%` }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
            <path d="M12 21s-7-4.6-7-11a7 7 0 0114 0c0 6.4-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </div>

        <div
          ref={markerRef}
          className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] ring-2 ring-brand-blue"
          style={{ left: `${start.x}%`, top: `${start.y}%` }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-black">
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M6 18h6l3-8h3M9 10H6l-1 3" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-blue" />
          <span className="text-xs font-bold text-black">{statusLabel}</span>
        </div>
        <span className="text-xs font-semibold text-neutral-500">
          Arrivée estimée · {(etaMinutes ?? eta)} min
        </span>
      </div>
    </div>
  );
}
