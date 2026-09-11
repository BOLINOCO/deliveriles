"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

// Chemins vectoriels représentant des objets du quotidien (viewBox 0 0 100 100)
const EVERYDAY_OBJECTS = [
  "M50 15 L85 32 L85 68 L50 85 L15 68 L15 32 Z", // Le Colis (cube isométrique)
  "M30 35 L30 85 L70 85 L70 35 L60 35 C60 20 40 20 40 35 L30 35 Z", // Le Sac de shopping
  "M25 20 L75 20 L70 85 L30 85 L25 20 Z", // Le Gobelet à emporter
  "M30 20 L50 30 L70 20 L90 40 L80 50 L80 90 L20 90 L20 50 L10 40 Z", // Le T-shirt
  "M50 25 C75 10 90 40 75 75 C60 90 40 90 25 75 C10 40 25 10 50 25 Z", // La Pomme
];

type Shape = {
  id: string;
  top: string;
  left: string;
  size: number;
  gradient: "navy" | "blue" | "orange";
};

const SHAPES: Shape[] = [
  { id: "s1", top: "10%", left: "56%", size: 100, gradient: "navy" },
  { id: "s2", top: "54%", left: "46%", size: 70, gradient: "blue" },
  { id: "s3", top: "24%", left: "14%", size: 78, gradient: "orange" },
  { id: "s4", top: "66%", left: "70%", size: 58, gradient: "blue" },
  { id: "s5", top: "6%", left: "22%", size: 44, gradient: "navy" },
];

export default function MorphingBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = containerRef.current;
    if (reduceMotion || !container) return;

    const paths = container.querySelectorAll<SVGPathElement>(".morph-path");
    const wrappers = container.querySelectorAll<HTMLDivElement>(".morph-shape");

    // 1. Morphing : chaque objet se transforme en un autre objet du quotidien
    paths.forEach((el) => {
      function morphLoop() {
        const nextObject =
          EVERYDAY_OBJECTS[Math.floor(Math.random() * EVERYDAY_OBJECTS.length)];
        anime({
          targets: el,
          d: nextObject,
          duration: anime.random(1500, 3000),
          easing: "easeInOutQuad",
          complete: () => setTimeout(morphLoop, anime.random(500, 1500)),
        });
      }
      setTimeout(morphLoop, Math.random() * 1000);
    });

    // 2. Flottaison : les objets dérivent doucement, comme en apesanteur
    wrappers.forEach((el) => {
      function floatLoop() {
        anime({
          targets: el,
          translateX: anime.random(-36, 36),
          translateY: anime.random(-36, 36),
          rotateZ: anime.random(-28, 28),
          scale: anime.random(85, 115) / 100,
          duration: anime.random(5000, 8000),
          easing: "easeInOutSine",
          complete: floatLoop,
        });
      }
      setTimeout(floatLoop, Math.random() * 500);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[32px] border border-neutral-200 bg-brand-surface"
    >
      {/* Dégradés partagés par les objets */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="gradDark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="gradGray" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
        </defs>
      </svg>

      {SHAPES.map((s) => (
        <div
          key={s.id}
          className="morph-shape absolute drop-shadow-[0_16px_28px_rgba(0,0,0,0.12)]"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
            <path
              className="morph-path"
              d={EVERYDAY_OBJECTS[0]}
              fill={`url(#grad${s.gradient === "navy" ? "Dark" : s.gradient === "blue" ? "Green" : "Gray"})`}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
