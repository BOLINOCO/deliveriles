"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function NavIcon({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={`flex flex-col items-center gap-1 ${active ? "text-black" : "text-neutral-400"}`}>
      {children}
    </span>
  );
}

export default function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-6 pb-[max(10px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="relative mx-auto flex max-w-md items-center justify-around">
        <Link href="/assistant" aria-label="Ti'bot — Assistant IA" className="absolute left-1/2 top-[-30px] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full shadow-[0_10px_22px_rgba(249,115,22,0.35),0_0_0_5px_#fff]">
          <Image
            src="/logos/logo-tibot.png"
            alt=""
            width={56}
            height={56}
            priority
            className="h-14 w-14 object-contain"
          />
        </Link>

        <Link href="/accueil">
          <NavIcon active={pathname === "/accueil"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
              <path d="M3 11l9-7 9 7" />
              <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
            </svg>
            <span className="text-[0.62rem] font-semibold">Accueil</span>
          </NavIcon>
        </Link>

        <Link href="/panier">
          <NavIcon active={pathname === "/panier"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
              <path d="M6 2l1.5 4M18 2l-1.5 4M3.5 9h17l-1.6 9.5a2 2 0 01-2 1.5H7.1a2 2 0 01-2-1.5L3.5 9z" />
            </svg>
            <span className="text-[0.62rem] font-semibold">Panier</span>
          </NavIcon>
        </Link>

        <div className="w-8" aria-hidden="true" />

        <Link href="/commandes">
          <NavIcon active={pathname === "/commandes"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
              <rect x="4" y="7" width="16" height="14" rx="2" />
              <path d="M8 7V5a4 4 0 018 0v2" />
            </svg>
            <span className="text-[0.62rem] font-semibold">Commandes</span>
          </NavIcon>
        </Link>

        <Link href="/profil">
          <NavIcon active={pathname === "/profil"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
            </svg>
            <span className="text-[0.62rem] font-semibold">Profil</span>
          </NavIcon>
        </Link>
      </div>
    </nav>
  );
}
