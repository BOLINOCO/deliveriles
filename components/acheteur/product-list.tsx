"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "./cart-context";

export default function ProductList({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  function handleAdd(product: Product) {
    addItem(product);
    setAdded(product.id);
    setTimeout(() => setAdded((current) => (current === product.id ? null : current)), 1200);
  }

  return (
    <ul className="mt-5 flex flex-col divide-y divide-neutral-100">
      {products.map((product) => (
        <li key={product.id} className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-bold text-black">{product.name}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {product.price.toFixed(2)} € {product.unit ? `/ ${product.unit}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAdd(product)}
            disabled={product.stock === 0}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
              added === product.id ? "bg-brand-blue text-white" : "bg-brand-navy text-white hover:bg-brand-blue"
            }`}
          >
            {product.stock === 0 ? "Épuisé" : added === product.id ? "Ajouté ✓" : "Ajouter"}
          </button>
        </li>
      ))}
    </ul>
  );
}
