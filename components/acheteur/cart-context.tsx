"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product, quantity = 1) {
    setItems((prev) => {
      // Un panier ne peut contenir des produits que d'une seule boutique à la fois
      // (la distance de livraison est calculée par boutique).
      const isDifferentShop = prev.length > 0 && prev[0].product.shopId !== product.shopId;
      const base = isDifferentShop ? [] : prev;

      const existing = base.find((i) => i.product.id === product.id);
      if (existing) {
        return base.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...base, { product, quantity }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  }

  function clear() {
    setItems([]);
  }

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.product.price, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé à l'intérieur d'un <CartProvider>.");
  return ctx;
}
