"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-context";
import type { ComposedOrder } from "@/lib/types";

type ChatEntry = { role: "user" | "assistant"; content: string; order?: ComposedOrder };

export default function ChatAssistant() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([
    {
      role: "assistant",
      content:
        "Dites-moi ce que vous voulez commander, par exemple : « 2 croissants et un café chez Le Fournil ».",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setError(null);
    setHistory((h) => [...h, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue.");
      const order = data as ComposedOrder;
      setHistory((h) => [...h, { role: "assistant", content: order.summary, order }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function handleValidate(order: ComposedOrder) {
    order.items.forEach((item) => {
      addItem(
        { id: item.productId, shopId: item.shopId, name: item.name, price: item.unitPrice, stock: 999 },
        item.quantity
      );
    });
    router.push("/panier");
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-1 pb-4">
        {history.map((entry, i) => (
          <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-snug ${
                entry.role === "user"
                  ? "rounded-br-md bg-brand-navy font-semibold text-white"
                  : "rounded-bl-md border border-neutral-200 bg-neutral-50 text-black"
              }`}
            >
              {entry.content}
              {entry.order && (
                <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
                  <ul className="mb-2 space-y-1 text-xs text-neutral-500">
                    {entry.order.items.map((item) => (
                      <li key={item.productId}>
                        {item.quantity} × {item.name} — {(item.quantity * item.unitPrice).toFixed(2)} €
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between border-t border-dashed border-neutral-200 pt-2 text-sm font-extrabold">
                    <span>Total</span>
                    <span className="text-brand-orange">{entry.order.pricing.total.toFixed(2)} €</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleValidate(entry.order!)}
                    className="mt-3 w-full rounded-full bg-brand-orange py-2.5 text-xs font-bold text-white hover:bg-brand-orange-deep"
                  >
                    Valider la commande
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-neutral-400">L&apos;assistant compose votre commande…</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-200 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ex : 2 croissants chez Le Fournil"
          className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          aria-label="Envoyer"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-white disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
