"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stocks", label: "Stocks" },
  { href: "/statistiques", label: "Statistiques" },
  { href: "/shop-editeur", label: "Ma boutique" },
];

export default function VendeurTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-neutral-100 px-4 sm:px-6">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold transition-colors ${
              active ? "border-brand-blue text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
