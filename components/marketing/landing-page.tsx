"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import MorphingBackground from "./morphing-background";
import { computeOrderTotal } from "@/lib/pricing";
import { RoleToggleCard } from "@/components/auth/role-toggle-card";

function formatEUR(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

// Exemple illustratif calculé par le vrai moteur de prix (lib/delivery-pricing.ts),
// pas des chiffres tapés à la main : 2 km, petit panier, conditions neutres.
const EXAMPLE_ORDER = computeOrderTotal(24.9, 2, 2, {
  isRaining: false,
  isNight: false,
  isHighDemand: false,
});

// Même logique pour l'exemple affiché dans le mock de conversation IA
// (2 croissants 1,40€ + 1 pain au chocolat 1,50€ + 1 café allongé 2,50€, Le Fournil à 1,2 km).
const AI_EXAMPLE_SUBTOTAL = 2 * 1.4 + 1.5 + 2.5;
const AI_EXAMPLE_ORDER = computeOrderTotal(AI_EXAMPLE_SUBTOTAL, 1.2, 4, {
  isRaining: false,
  isNight: false,
  isHighDemand: false,
});

/* ============================================================
   Classes de boutons partagées (tokens bleu / orange / navy — identité Deliver'îles)
   ============================================================ */
const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-full bg-brand-navy px-6 py-3.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg";
const BTN_SECONDARY =
  "inline-flex items-center gap-2 rounded-full border-[1.5px] border-brand-navy bg-white px-6 py-3.5 text-sm font-bold text-brand-navy transition duration-200 hover:bg-neutral-50";
const BTN_ACCENT =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-orange-deep hover:shadow-lg";
const BTN_GHOST =
  "inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2.5 text-sm font-bold text-brand-navy transition duration-200 hover:bg-neutral-200";

/* ============================================================
   Reveal — apparition douce au scroll (remplace l'ancien
   IntersectionObserver vanilla JS)
   ============================================================ */
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ============================================================
   Icônes (petits SVG inline, cohérents, pas d'emoji)
   ============================================================ */
function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white transition-all duration-300 ${
        scrolled ? "border-b border-neutral-200 py-3 shadow-sm" : "border-b border-transparent py-[18px]"
      }`}
    >
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-6 px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-extrabold text-brand-navy">
          <Image
            src="/logos/logo-secondaire.png"
            alt="Logo Deliver'îles"
            width={32}
            height={32}
            priority
            className="rounded-full object-contain"
          />
          Deliver&apos;îles
        </a>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-neutral-500 md:flex">
          <a href="#profiles" className="transition-colors hover:text-brand-navy">Les 3 profils</a>
          <a href="#ai" className="transition-colors hover:text-brand-navy">Assistant IA</a>
          <a href="/connexion" className="transition-colors hover:text-brand-navy">Se connecter</a>
          <a href="#pwa" className="transition-colors hover:text-brand-navy">Installer l&apos;app</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <a href="/accueil" className={BTN_GHOST}>Parcourir</a>
          <a href="/inscription" className={BTN_PRIMARY + " !px-5 !py-2.5 !text-[0.85rem]"}>Créer un compte</a>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  return (
    <section id="top" className="pt-[150px] pb-20">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">
            La marketplace locale nouvelle génération
          </span>
          <h1 className="mt-3.5 font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-tight text-brand-navy sm:text-6xl">
            Vous voulez le commander ?<br />
            <em className="not-italic text-brand-blue">Chez nous vous pouvez.</em>
          </h1>
          <p className="mt-5 max-w-[460px] text-lg text-neutral-500">
            Tous vos commerçants de quartier réunis dans une seule appli. Un assistant IA prépare votre
            commande, vous n&apos;avez plus qu&apos;à valider — et vous suivez votre livreur en temps réel.
          </p>

          <form
            className="mt-8 flex max-w-[480px] items-center gap-2.5 rounded-full border-[1.5px] border-neutral-200 bg-white py-2 pl-5 pr-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            onSubmit={(e) => e.preventDefault()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0 text-neutral-400">
              <path d="M12 21s-7-4.6-7-11a7 7 0 0114 0c0 6.4-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <input
              type="text"
              placeholder="Entrez votre adresse de livraison"
              aria-label="Adresse de livraison"
              className="min-w-0 flex-1 border-none bg-transparent text-[0.95rem] text-brand-navy outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              aria-label="Rechercher"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-orange"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-4">
            <a href="/inscription?role=vendeur" className="border-b border-transparent text-[0.86rem] font-semibold text-neutral-500 transition-colors hover:border-brand-navy hover:text-brand-navy">
              Devenir vendeur
            </a>
            <a href="/inscription?role=livreur" className="border-b border-transparent text-[0.86rem] font-semibold text-neutral-500 transition-colors hover:border-brand-navy hover:text-brand-navy">
              Devenir livreur
            </a>
          </div>
        </div>

        <Reveal>
          <MorphingBackground />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   CATEGORY STRIP
   ============================================================ */
const CATEGORIES: { label: string; icon: ReactNode }[] = [
  {
    label: "Boulangerie",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13c0-4 3.6-7 8-7s8 3 8 7v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" />
        <path d="M9 9v9M15 9v9" />
      </svg>
    ),
  },
  {
    label: "Fruits & légumes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8.5a5 5 0 015 5c0 4-3.2 7-5 8.5-1.8-1.5-5-4.5-5-8.5a5 5 0 015-5z" />
        <path d="M12 8.5c0-2.2 1.2-3.5 3-3.5" />
      </svg>
    ),
  },
  {
    label: "Café",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h11v6a5 5 0 01-5 5h-1a5 5 0 01-5-5V8z" />
        <path d="M16 9.5h2a2 2 0 012 2v0a2 2 0 01-2 2h-2" />
        <path d="M8 4.5v2M12 4.5v2" />
      </svg>
    ),
  },
  {
    label: "Boucherie",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 15.5a5 5 0 016.3-6c2.6 1 4.3 2.8 5.2 6l-2.8 2.8c-2.6 1-4.4-.8-5.4-2.8z" />
        <circle cx="6.5" cy="17.5" r="2" />
      </svg>
    ),
  },
  {
    label: "Fleuriste",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7.5" r="2.3" />
        <circle cx="12" cy="16.5" r="2.3" />
        <circle cx="7.5" cy="12" r="2.3" />
        <circle cx="16.5" cy="12" r="2.3" />
        <circle cx="12" cy="12" r="1.8" />
      </svg>
    ),
  },
  {
    label: "Mercerie",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19L18 6" />
        <circle cx="19" cy="5" r="2" />
        <path d="M7 13.5c2 0 3 1 3 3" />
      </svg>
    ),
  },
];

function CategoryStrip() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1160px] px-6">
        <Reveal>
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">Explorez</span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-brand-navy sm:text-3xl">Par catégorie de shop</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-3 gap-3.5 sm:grid-cols-6">
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              className="flex flex-col items-center gap-2.5 rounded-2xl bg-brand-surface px-3 py-6 text-center transition-all duration-200 hover:-translate-y-1 hover:bg-brand-blue-soft"
            >
              <span className="h-[26px] w-[26px] text-brand-navy">{c.icon}</span>
              <span className="text-[0.8rem] font-bold text-brand-navy">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRICING / TRANSPARENCE
   ============================================================ */
function PricingSection() {
  return (
    <section className="border-y border-neutral-200 bg-brand-surface py-20">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal>
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">Tarification</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-brand-navy sm:text-4xl">
            Le prix affiché est toujours le prix final
          </h2>
          <div className="mt-6 flex flex-col gap-3.5">
            {[
              { title: "Prix du produit", desc: "fixé librement par le commerçant, versé à 100% au vendeur." },
              { title: "Frais de livraison", desc: "calculés selon la distance et reversés au livreur." },
              { title: "Commission plateforme", desc: "visible dès la fiche produit, jamais découverte au paiement." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-brand-blue" />
                <p className="text-[0.95rem] text-neutral-500">
                  <strong className="text-brand-navy">{item.title}</strong> — {item.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[0.98rem] font-extrabold">Exemple de commande</span>
            <span className="rounded-full bg-brand-blue-soft px-2.5 py-1 text-[0.7rem] font-bold text-brand-blue">
              Prix final
            </span>
          </div>
          {[
            ["Prix produit", formatEUR(EXAMPLE_ORDER.subtotal)],
            ["Livraison (part livreur)", formatEUR(EXAMPLE_ORDER.delivery)],
            ["Commission plateforme", formatEUR(EXAMPLE_ORDER.commission)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 text-[0.9rem] tabular-nums text-neutral-500">
              <span>{label}</span>
              <span className="font-semibold text-brand-navy">{value}</span>
            </div>
          ))}
          <hr className="my-2.5 border-dashed border-neutral-200" />
          <div className="flex justify-between pt-1 text-[1.1rem] font-extrabold tabular-nums">
            <span>Total</span>
            <span className="text-brand-orange">{formatEUR(EXAMPLE_ORDER.total)}</span>
          </div>
          <p className="mt-3.5 text-[0.8rem] text-neutral-400">
            Aucune surprise au paiement : ce montant est celui affiché dès la fiche produit. La livraison
            se répartit 80% pour le livreur, 20% pour la plateforme.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   SIGNUP TEASER
   ============================================================ */
function SignupSection() {
  const [isSeller, setIsSeller] = useState(false);
  const [isCourier, setIsCourier] = useState(false);

  const selectedRoles = [isSeller && "vendeur", isCourier && "livreur"].filter(Boolean).join(",");
  const href = selectedRoles ? `/inscription?role=${selectedRoles}` : "/inscription";

  return (
    <section id="inscription" className="py-20">
      <div className="mx-auto max-w-[1160px] px-6">
        <Reveal>
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">Inscription</span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-brand-navy sm:text-3xl">
            Un seul compte, autant de rôles que vous voulez
          </h2>
          <p className="mt-3.5 max-w-xl text-[1.05rem] text-neutral-500">
            Acheteur par défaut. Cochez Vendeur et/ou Livreur si vous voulez aussi vendre ou livrer —
            un livreur ou un vendeur reste toujours acheteur aussi.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3" role="group" aria-label="Aperçu des rôles à l'inscription">
            <RoleToggleCard
              title="Acheteur"
              description="Commandez chez tous les commerçants locaux partenaires."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2l1.5 4M18 2l-1.5 4M3.5 9h17l-1.6 9.5a2 2 0 01-2 1.5H7.1a2 2 0 01-2-1.5L3.5 9z" />
                </svg>
              }
              active
              alwaysOn
            />
            <RoleToggleCard
              title="Vendeur"
              description="Ouvrez votre shop, gérez vos stocks. 0% de commission produit."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l1.5-5h15L21 9" />
                  <path d="M3 9h18v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                  <path d="M9 13a3 3 0 006 0" />
                </svg>
              }
              active={isSeller}
              onToggle={() => setIsSeller((s) => !s)}
            />
            <RoleToggleCard
              title="Livreur"
              description="Acceptez des courses, touchez 80% des frais de livraison."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="18" r="2.5" />
                  <circle cx="18" cy="18" r="2.5" />
                  <path d="M6 18h6l3-8h3M9 10H6l-1 3" />
                  <path d="M13 6h3l2 4" />
                </svg>
              }
              active={isCourier}
              onToggle={() => setIsCourier((c) => !c)}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-[0.92rem] font-semibold text-brand-navy">
              <CheckIcon className="h-4 w-4 flex-shrink-0 text-brand-blue" />
              {isSeller && isCourier ? (
                <span>Acheteur, vendeur <strong>et</strong> livreur, avec un seul compte.</span>
              ) : isSeller ? (
                <span>Acheteur <strong>et</strong> vendeur, avec un seul compte.</span>
              ) : isCourier ? (
                <span>Acheteur <strong>et</strong> livreur, avec un seul compte.</span>
              ) : (
                <span>Vous pourrez activer Vendeur ou Livreur plus tard, à tout moment.</span>
              )}
            </p>
            <a href={href} className={BTN_PRIMARY}>Créer mon compte</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   SOCIAL PROOF MARQUEE
   Partenaires chargés depuis la table SQL `partners` (supabase/migrations/0003_partners.sql)
   et passés en prop par app/page.tsx. Fallback statique en mode démo.
   ============================================================ */
export type Partner = {
  name: string;
  category: string;
  color: string;
};

const SHOPS: Partner[] = [
  { name: "Le Fournil", category: "Boulangerie", color: "#0F172A" },
  { name: "Marché Vert", category: "Primeur", color: "#0EA5E9" },
  { name: "Café Lucie", category: "Café", color: "#F97316" },
  { name: "Boucherie Martin", category: "Boucherie", color: "#0F172A" },
  { name: "Fleuriste Iris", category: "Fleuriste", color: "#0EA5E9" },
  { name: "La Mercerie", category: "Loisirs créatifs", color: "#F97316" },
  { name: "Épicerie Bio", category: "Épicerie", color: "#0F172A" },
  { name: "Poisson d'Avril", category: "Poissonnerie", color: "#0EA5E9" },
];

function ShopBadge({ name, category, color }: Partner) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="flex flex-shrink-0 items-center gap-2.5 rounded-full border border-neutral-200 bg-white py-2 pl-2 pr-4.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-[0.78rem] font-extrabold text-white"
        style={{ background: color }}
      >
        {initials}
      </span>
      <span className="whitespace-nowrap text-[0.86rem] font-semibold text-neutral-500">
        {name} · {category}
      </span>
    </div>
  );
}

function SocialProof({ partners }: { partners?: Partner[] }) {
  const shops = partners && partners.length > 0 ? partners : SHOPS;
  const track = [...shops, ...shops];
  return (
    <section className="py-12">
      <p className="mb-6 text-center text-[0.95rem] text-neutral-500">
        Avec plus de <strong className="text-brand-navy">500 magasins locaux</strong> partenaires
      </p>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <div className="flex w-max animate-scroll-left gap-3.5">
          {track.map((s, i) => (
            <ShopBadge key={`${s.name}-${i}`} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PROFILES
   ============================================================ */
const PROFILES = [
  {
    title: "Le Vendeur",
    desc: "Le commerçant qui ouvre son shop sur Deliver'îles et garde la main sur son activité.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M4 9h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V9z" />
        <path d="M9 13a3 3 0 006 0" />
      </svg>
    ),
    features: [
      "Tableau de bord de gestion des stocks",
      "Mini-site \u201cShop\u201d personnalisable",
      "100% du prix produit reversé",
    ],
    pricing: (
      <>
        <strong className="text-brand-navy">25 €/mois</strong> d&apos;abonnement — 0% de commission sur le produit
      </>
    ),
  },
  {
    title: "Le Livreur",
    desc: "Toujours au bon endroit au bon moment, avec une visibilité claire sur chaque course.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M6 18h6l3-8h3M9 10H6l-1 3" />
        <path d="M13 6h3l2 4" />
      </svg>
    ),
    features: [
      "Notifications de courses à proximité",
      "Accepter ou refuser en un geste",
      "Carte de l'acheteur en temps réel",
    ],
    pricing: (
      <>
        Gratuit — <strong className="text-brand-navy">Premium 10 €/mois</strong> pour prioriser vos courses
      </>
    ),
  },
  {
    title: "L'Acheteur",
    desc: "Naviguez, demandez à l'IA, validez. Votre commande arrive sous vos yeux, en direct.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2l1.5 4M18 2l-1.5 4M3.5 9h17l-1.6 9.5a2 2 0 01-2 1.5H7.1a2 2 0 01-2-1.5L3.5 9z" />
      </svg>
    ),
    features: ["Navigation simple par shop", "Commande assistée par l'IA", "Suivi GPS temps réel du livreur"],
    pricing: (
      <>
        <strong className="text-brand-navy">Gratuit</strong> — livraison et commission toujours visibles avant paiement
      </>
    ),
  },
];

function ProfilesSection() {
  return (
    <section id="profiles" className="border-y border-neutral-200 bg-brand-surface py-24">
      <div className="mx-auto max-w-[1160px] px-6">
        <Reveal className="max-w-xl">
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">
            Trois profils, trois expériences
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-brand-navy sm:text-4xl">
            Une appli, trois façons d&apos;y participer
          </h2>
          <p className="mt-3.5 text-[1.05rem] text-neutral-500">
            Vendeur, livreur ou acheteur : chacun a sa propre interface, pensée pour son usage.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PROFILES.map((p) => (
            <Reveal key={p.title}>
              <article className="flex h-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
                <div className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl bg-brand-blue-soft">
                  <span className="h-6 w-6 text-brand-blue">{p.icon}</span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-brand-navy">{p.title}</h3>
                <p className="text-[0.92rem] text-neutral-500">{p.desc}</p>
                <ul className="mt-0.5 flex flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.87rem] text-neutral-500">
                      <CheckIcon className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-brand-blue" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto border-t border-neutral-200 pt-4 text-[0.82rem] text-neutral-400">
                  {p.pricing}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PHONE FRAME (partagé par les deux aperçus produit)
   ============================================================ */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[300px] overflow-hidden rounded-[40px] border-[8px] border-brand-navy bg-brand-navy shadow-[0_0_0_1px_#111,0_40px_80px_rgba(0,0,0,0.18)]">
      <div className="flex h-[26px] items-center justify-center bg-brand-navy">
        <div className="h-4 w-[70px] rounded-full bg-brand-navy ring-1 ring-neutral-800" />
      </div>
      <div className="flex min-h-[520px] flex-col gap-2.5 bg-white p-4">{children}</div>
    </div>
  );
}

/* ============================================================
   AI SECTION
   ============================================================ */
function AIPreviewPhone() {
  return (
    <Reveal>
      <PhoneFrame>
        <div className="max-w-[86%] self-end rounded-2xl rounded-br-md bg-brand-navy px-3.5 py-3 text-[0.82rem] font-semibold leading-snug text-white">
          Commande-moi le petit-déjeuner habituel chez Le Fournil, livré avant 8h.
        </div>
        <div className="max-w-[86%] self-start rounded-2xl rounded-bl-md border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[0.82rem] leading-snug text-brand-navy">
          <span className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-bold text-brand-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" />
            </svg>
            Assistant Deliver&apos;îles
          </span>
          2 croissants, 1 pain au chocolat, 1 café allongé — Le Fournil. Livraison estimée 7h45. Total avec
          livraison et frais : <strong>{formatEUR(AI_EXAMPLE_ORDER.total)}</strong>.
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button type="button" className={BTN_ACCENT}>Valider la commande</button>
          <p className="text-center text-[0.72rem] text-neutral-400">Il ne vous reste plus qu&apos;à valider.</p>
        </div>
      </PhoneFrame>
    </Reveal>
  );
}

function AISection() {
  return (
    <section id="ai" className="py-24">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[1fr_0.9fr]">
        <Reveal>
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">IA native</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-brand-navy sm:text-4xl">
            Dites ce qu&apos;il vous faut. L&apos;IA prépare tout.
          </h2>
          <p className="mt-3.5 max-w-lg text-[1.05rem] text-neutral-500">
            L&apos;assistant intégré compose votre commande complète — produits, shop, créneau de livraison —
            à partir d&apos;une simple phrase. Il ne vous reste plus qu&apos;à valider.
          </p>
          <div className="mt-7 flex flex-col gap-3.5">
            {[
              ["01", "Vous décrivez votre envie", "à l'oral ou à l'écrit."],
              ["02", "L'IA compose la commande", "avec le prix final transparent."],
              ["03", "Vous validez", "— ou ajustez, en un mot."],
            ].map(([num, strong, rest]) => (
              <div key={num} className="flex items-start gap-3">
                <span className="flex-shrink-0 rounded-lg bg-brand-blue-soft px-2.5 py-1 text-[0.78rem] font-extrabold text-brand-blue">
                  {num}
                </span>
                <p className="text-[0.92rem] text-neutral-500">
                  <strong className="text-brand-navy">{strong}</strong> {rest}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <AIPreviewPhone />
      </div>
    </section>
  );
}

/* ============================================================
   WEBAPP CORE PREVIEW
   ============================================================ */
function AppCorePreviewPhone() {
  const shopTiles = [
    { name: "Le Fournil", meta: "Boulangerie · ⭐ 4.8", color: "#0F172A" },
    { name: "Marché Vert", meta: "Fruits & légumes · ⭐ 4.9", color: "#0EA5E9" },
    { name: "Café Lucie", meta: "Café · ⭐ 4.7", color: "#F97316" },
    { name: "La Mercerie", meta: "Loisirs créatifs · ⭐ 4.6", color: "#38BDF8" },
  ];

  return (
    <Reveal>
      <PhoneFrame>
        <div className="flex items-center gap-2.5 pb-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4 flex-shrink-0 text-neutral-400">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="text-[0.78rem] text-neutral-400">Rechercher un shop, un produit…</span>
          </div>
          <div className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-navy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] text-white">
              <path d="M6 2l1.5 4M18 2l-1.5 4M3.5 9h17l-1.6 9.5a2 2 0 01-2 1.5H7.1a2 2 0 01-2-1.5L3.5 9z" />
            </svg>
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[0.6rem] font-extrabold text-white">
              3
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {shopTiles.map((s) => (
            <div key={s.name} className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
              <div className="mb-2 h-[52px] rounded-lg" style={{ background: s.color }} />
              <p className="text-[0.76rem] font-extrabold text-brand-navy">{s.name}</p>
              <p className="mt-0.5 text-[0.66rem] text-neutral-400">{s.meta}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-auto flex items-center justify-around border-t border-neutral-200 pt-3.5">
          <div className="absolute -top-[26px] left-1/2 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full bg-brand-orange shadow-[0_10px_22px_rgba(249,115,22,0.4),0_0_0_5px_#fff]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px] text-white">
              <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1 text-brand-navy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M3 11l9-7 9 7" />
              <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
            </svg>
            <span className="text-[0.6rem] font-semibold">Accueil</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-neutral-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-[18px] w-[18px]">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="text-[0.6rem] font-semibold">Recherche</span>
          </div>
          <div className="w-5" />
          <div className="flex flex-col items-center gap-1 text-neutral-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <rect x="4" y="7" width="16" height="14" rx="2" />
              <path d="M8 7V5a4 4 0 018 0v2" />
            </svg>
            <span className="text-[0.6rem] font-semibold">Commandes</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-neutral-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
            </svg>
            <span className="text-[0.6rem] font-semibold">Profil</span>
          </div>
        </div>
      </PhoneFrame>
    </Reveal>
  );
}

function CoreAppSection() {
  return (
    <section className="border-y border-neutral-200 bg-brand-surface py-24">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[0.9fr_1fr]">
        <AppCorePreviewPhone />

        <Reveal>
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">
            Interface de la WebApp
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-brand-navy sm:text-4xl">
            Une recherche claire. L&apos;IA jamais loin.
          </h2>
          <p className="mt-3.5 max-w-lg text-[1.05rem] text-neutral-500">
            La barre de recherche trouve n&apos;importe quel shop en un instant, le panier reste toujours
            visible en un coup d&apos;œil, et le bouton IA flotte en permanence en bas de l&apos;écran.
          </p>
          <div className="mt-7 flex flex-col gap-3.5">
            {[
              ["↗", "Recherche intuitive", "par shop ou par produit, dans le header."],
              ["🛒", "Panier toujours accessible", ", en haut à droite."],
              ["✦", "Bouton IA persistant", ", ancré en bas de l'écran."],
            ].map(([sym, strong, rest]) => (
              <div key={strong} className="flex items-start gap-3">
                <span className="flex-shrink-0 rounded-lg bg-brand-blue-soft px-2.5 py-1 text-[0.78rem] font-extrabold text-brand-blue">
                  {sym}
                </span>
                <p className="text-[0.92rem] text-neutral-500">
                  <strong className="text-brand-navy">{strong}</strong>{rest}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   PWA ONBOARDING
   ============================================================ */
const PWA_STEPS: Record<"ios" | "android", { title: string; icon: ReactNode }[]> = {
  ios: [
    { title: "Ouvrez deliveriles.gp dans Safari", icon: <path d="M12 8v4l3 2" /> },
    { title: "Touchez l'icône Partager", icon: <path d="M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /> },
    { title: "Choisissez \u201cSur l'écran d'accueil\u201d", icon: <path d="M12 8v8M8 12h8" /> },
    { title: "Confirmez avec \u201cAjouter\u201d", icon: <path d="M20 6L9 17l-5-5" /> },
  ],
  android: [
    { title: "Ouvrez deliveriles.gp dans Chrome", icon: <path d="M12 8v4l3 2" /> },
    { title: "Touchez le menu ⋮ en haut à droite", icon: <><circle cx="12" cy="6" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="18" r="1" /></> },
    { title: "Sélectionnez \u201cAjouter à l'écran d'accueil\u201d", icon: <path d="M12 8v8M8 12h8" /> },
    { title: "Confirmez — l'icône rejoint votre écran", icon: <path d="M20 6L9 17l-5-5" /> },
  ],
};

function PWASection() {
  const [tab, setTab] = useState<"ios" | "android">("ios");

  return (
    <section id="pwa" className="py-24">
      <div className="mx-auto max-w-[1160px] px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <span className="text-[0.82rem] font-bold uppercase tracking-wide text-brand-orange">
            Sans téléchargement
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-brand-navy sm:text-3xl">
            Installez Deliver&apos;îles en 20 secondes
          </h2>
          <p className="mt-3.5 text-[1.05rem] text-neutral-500">
            Pas de store, pas de mise à jour à gérer. Ajoutez l&apos;icône sur votre écran d&apos;accueil et
            retrouvez l&apos;appli comme n&apos;importe quelle autre.
          </p>
        </Reveal>

        <div className="mt-9 mb-10 flex justify-center gap-2" role="tablist" aria-label="Choix du système">
          <button
            role="tab"
            aria-selected={tab === "ios"}
            onClick={() => setTab("ios")}
            className={`rounded-full px-5.5 py-2.5 text-[0.88rem] font-bold transition-colors ${
              tab === "ios" ? "bg-brand-navy text-white" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            iOS (Safari)
          </button>
          <button
            role="tab"
            aria-selected={tab === "android"}
            onClick={() => setTab("android")}
            className={`rounded-full px-5.5 py-2.5 text-[0.88rem] font-bold transition-colors ${
              tab === "android" ? "bg-brand-navy text-white" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            Android (Chrome)
          </button>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {PWA_STEPS[tab].map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-[0.8rem] font-extrabold text-white">
                {i + 1}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2.5 h-[22px] w-[22px] text-neutral-400">
                {step.icon}
              </svg>
              <p className="text-[0.8rem] text-neutral-500">{step.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer className="bg-brand-navy py-16 text-white">
      <div className="mx-auto max-w-[1160px] px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
              <Image
                src="/logos/logo-secondaire.png"
                alt="Logo Deliver'îles"
                width={28}
                height={28}
                className="rounded-full object-contain"
              />
              Deliver&apos;îles
            </a>
            <p className="mt-3.5 max-w-[280px] text-[0.88rem] text-neutral-400">
              La marketplace locale nouvelle génération. Vous voulez le commander ? Chez nous vous pouvez.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-[0.8rem] font-bold uppercase tracking-wide text-neutral-500">Produit</h4>
            <a href="#profiles" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Les 3 profils</a>
            <a href="#ai" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Assistant IA</a>
            <a href="#pwa" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Installer l&apos;app</a>
          </div>
          <div>
            <h4 className="mb-4 text-[0.8rem] font-bold uppercase tracking-wide text-neutral-500">Profils</h4>
            <a href="/inscription?role=vendeur" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Devenir vendeur</a>
            <a href="/inscription?role=livreur" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Devenir livreur</a>
            <a href="/inscription" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">S&apos;inscrire</a>
          </div>
          <div>
            <h4 className="mb-4 text-[0.8rem] font-bold uppercase tracking-wide text-neutral-500">Légal</h4>
            <a href="#" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Conditions générales</a>
            <a href="#" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Confidentialité</a>
            <a href="#" className="block py-1.5 text-[0.88rem] text-neutral-300 transition-colors hover:text-white">Nous contacter</a>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-[0.78rem] text-neutral-500">
          <span>© 2026 Deliver&apos;îles — Prototype de démonstration</span>
          <span>Sans commission cachée</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function LandingPage({ partners }: { partners?: Partner[] }) {
  return (
    <div className="bg-white font-sans text-brand-navy">
      <SiteNav />
      <Hero />
      <CategoryStrip />
      <PricingSection />
      <SignupSection />
      <SocialProof partners={partners} />
      <ProfilesSection />
      <AISection />
      <CoreAppSection />
      <PWASection />
      <Footer />
    </div>
  );
}
