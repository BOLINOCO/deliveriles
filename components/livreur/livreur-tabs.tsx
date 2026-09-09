"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/courses", label: "Courses" },
  { href: "/gains", label: "Gains" },
];

export default function LivreurTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-t border-neutral-100 px-4 sm:px-6">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
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
