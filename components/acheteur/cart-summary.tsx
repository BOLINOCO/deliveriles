"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./cart-context";
import { computeOrderTotal } from "@/lib/pricing";
import { SHOPS } from "@/lib/mock-data";
import PlaceOrderButton from "./place-order-button";

export default function CartSummary() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-neutral-400">Votre panier est vide.</p>
        <button
          type="button"
          onClick={() => router.push("/accueil")}
          className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-blue"
        >
          Découvrir les shops
        </button>
      </div>
    );
  }

  const shop = SHOPS.find((s) => s.id === items[0].product.shopId);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const { delivery, commission, total } = computeOrderTotal(subtotal, shop?.distanceKm ?? 2, totalQuantity);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-neutral-100">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-bold text-black">{product.name}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{product.price.toFixed(2)} € / unité</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-2 py-1">
                <button
                  type="button"
                  aria-label="Diminuer la quantité"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-black hover:bg-neutral-100"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-black hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                aria-label="Retirer l'article"
                onClick={() => removeItem(product.id)}
                className="text-xs font-semibold text-neutral-400 hover:text-black"
              >
                Retirer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <div className="flex justify-between py-1.5 text-sm text-neutral-500">
          <span>Prix produits</span>
          <span className="font-semibold text-black">{subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between py-1.5 text-sm text-neutral-500">
          <span>Livraison</span>
          <span className="font-semibold text-black">{delivery.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between py-1.5 text-sm text-neutral-500">
          <span>Commission plateforme</span>
          <span className="font-semibold text-black">{commission.toFixed(2)} €</span>
        </div>
        <hr className="my-2 border-dashed border-neutral-200" />
        <div className="flex justify-between pt-1 text-base font-extrabold">
          <span>Total</span>
          <span className="text-brand-orange">{total.toFixed(2)} €</span>
        </div>
      </div>

      {/* En mode connecté, la commande est validée serveur (POST /api/orders).
          Hors Supabase, on garde la démo : redirection vers un suivi simulé. */}
      <PlaceOrderButton shopId={items[0].product.shopId} />
    </div>
  );
}
