import { Suspense } from "react";
import { CartProvider } from "@/components/acheteur/cart-context";
import Header from "@/components/acheteur/header";
import BottomBar from "@/components/acheteur/bottom-bar";

export default function AcheteurLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Suspense fallback={<div className="h-[60px]" />}>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-white pb-24 pt-[76px]">{children}</main>
      <BottomBar />
    </CartProvider>
  );
}
