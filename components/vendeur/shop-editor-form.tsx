"use client";

import { useState } from "react";
import type { Shop } from "@/lib/types";

const COLOR_OPTIONS = [
  { label: "Navy", value: "#0F172A" },
  { label: "Bleu", value: "#0EA5E9" },
  { label: "Orange", value: "#F97316" },
  { label: "Gris clair", value: "#E2E8F0" },
];

export default function ShopEditorForm({ shop, demo = false }: { shop: Shop; demo?: boolean }) {
  const [name, setName] = useState(shop.name);
  const [category, setCategory] = useState(shop.category);
  const [description, setDescription] = useState(shop.description ?? "");
  const [color, setColor] = useState(shop.color);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (demo) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description, color }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Enregistrement impossible.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-neutral-500">Nom de la boutique</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-neutral-500">Catégorie</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-neutral-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Présentez votre boutique en quelques mots…"
            className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-neutral-500">Couleur de bannière</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ${
                  color === c.value ? "ring-brand-navy" : "ring-transparent"
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-brand-navy py-3 text-sm font-bold text-white transition-colors hover:bg-brand-blue disabled:opacity-60"
        >
          {saved ? "Enregistré ✓" : saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </form>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Aperçu public</p>
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
          <div className="h-28" style={{ background: color }} />
          <div className="p-4">
            <h3 className="text-lg font-extrabold text-black">{name || "Nom de la boutique"}</h3>
            <p className="mt-1 text-sm text-neutral-400">
              {category || "Catégorie"} · ⭐ {shop.rating}
            </p>
            {description && <p className="mt-3 text-sm text-neutral-500">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
