"use client";

import { type FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "./cart-context";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { count } = useCart();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");
    router.push(`/accueil?${params.toString()}`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
      <Link
        href="/accueil"
        aria-label="Accueil"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
      >
        <Image
          src="/logos/logo-principal.png"
          alt="Deliver'îles"
          width={32}
          height={32}
          className="rounded-full object-contain"
        />
      </Link>
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4 flex-shrink-0 text-neutral-400">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un shop, un produit…"
          aria-label="Rechercher"
          className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
        />
      </form>

      <Link
        href="/panier"
        aria-label="Voir le panier"
        className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition-colors hover:bg-brand-blue"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
          <path d="M6 2l1.5 4M18 2l-1.5 4M3.5 9h17l-1.6 9.5a2 2 0 01-2 1.5H7.1a2 2 0 01-2-1.5L3.5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[0.62rem] font-extrabold text-white">
            {count}
          </span>
        )}
      </Link>
    </header>
  );
}
