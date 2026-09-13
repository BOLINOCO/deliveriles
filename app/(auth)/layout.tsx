import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8">
        <Link href="/" className="mb-6 flex items-center gap-2 font-display text-base font-extrabold text-brand-navy">
          <Image
            src="/logos/logo-principal.png"
            alt="Logo Deliver'îles"
            width={26}
            height={26}
            className="rounded-full object-contain"
          />
          Deliver&apos;îles
        </Link>
        {children}
      </div>
    </div>
  );
}
