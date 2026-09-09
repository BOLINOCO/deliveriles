"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/types";

type Props = {
  initialProducts: Product[];
  shopId: string;
  /** true quand Supabase n'est pas configuré — comportement démo conservé */
  demo?: boolean;
};

export default function StockTable({ initialProducts, shopId, demo = false }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingRef = useRef<Map<string, number>>(new Map());

  async function persistStock(id: string, value: number) {
    if (demo) return;
    // Anti-doublon : on n'envoie que la dernière valeur si l'utilisateur clique vite.
    pendingRef.current.set(id, value);
    const target = value;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/shop/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: target }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Sauvegarde impossible.");
      }
      pendingRef.current.delete(id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Sauvegarde impossible.");
    } finally {
      if (!pendingRef.current.has(id)) setSaving(false);
    }
  }

  function updateStock(id: string, delta: number) {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = Math.max(0, p.stock + delta);
        void persistStock(id, next);
        return { ...p, stock: next };
      })
    );
  }

  function setStockValue(id: string, value: number) {
    const safe = Math.max(0, value);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: safe } : p)));
    void persistStock(id, safe);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const priceValue = parseFloat(price.replace(",", "."));
    const stockValue = parseInt(stock, 10);
    if (!name || Number.isNaN(priceValue) || Number.isNaN(stockValue)) return;

    if (demo) {
      setProducts((prev) => [
        ...prev,
        { id: `local_${Date.now()}`, shopId, name, price: priceValue, stock: stockValue },
      ]);
      setName("");
      setPrice("");
      setStock("");
      setShowForm(false);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: priceValue, stock: stockValue }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        product?: Product;
        error?: string;
      };
      if (!res.ok || !data.product) {
        throw new Error(data.error ?? "Création impossible.");
      }
      setProducts((prev) => [
        ...prev,
        {
          id: data.product!.id,
          shopId,
          name: data.product!.name,
          price: Number(data.product!.price),
          unit: data.product!.unit ?? undefined,
          stock: Number(data.product!.stock),
        },
      ]);
      setName("");
      setPrice("");
      setStock("");
      setShowForm(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {products.length} produits au catalogue
          {saving && <span className="ml-2 text-brand-green">Sauvegarde…</span>}
          {!saving && saveError && (
            <span className="ml-2 text-red-500">{saveError}</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue"
        >
          {showForm ? "Annuler" : "+ Ajouter un produit"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du produit"
            required
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none sm:col-span-2"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Prix (€)"
            required
            inputMode="decimal"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock initial"
            required
            inputMode="numeric"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-4">
            Ajouter au catalogue
          </button>
        </form>
      )}

      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        {products.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div>
              <p className="text-sm font-bold text-black">{product.name}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {product.price.toFixed(2)} € {product.unit ? `/ ${product.unit}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {product.stock === 0 ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">Rupture</span>
              ) : product.stock <= 5 ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">Stock faible</span>
              ) : null}
              <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-2 py-1">
                <button
                  type="button"
                  onClick={() => updateStock(product.id, -1)}
                  aria-label="Diminuer le stock"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-black hover:bg-neutral-100"
                >
                  −
                </button>
                <input
                  value={product.stock}
                  onChange={(e) => setStockValue(product.id, parseInt(e.target.value || "0", 10))}
                  className="w-10 bg-transparent text-center text-sm font-bold outline-none"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => updateStock(product.id, 1)}
                  aria-label="Augmenter le stock"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-black hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
