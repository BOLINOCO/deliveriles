import Link from "next/link";
import LivreurTabs from "@/components/livreur/livreur-tabs";
import LivreurHeaderInfo from "@/components/livreur/livreur-header-info";

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <LivreurHeaderInfo />
          <div className="flex items-center gap-2">
            <Link href="/accueil" className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-black hover:bg-neutral-50">
              Espace acheteur
            </Link>
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-500">Gratuit</span>
          </div>
        </div>
        <LivreurTabs />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
