import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import LandingPage, { type Partner } from "@/components/marketing/landing-page";

// Revalidation ISR : le bandeau partenaires est re-read depuis Supabase
// au max toutes les 60 s, sans redeploy (modifie la table SQL → visible en ~1 min).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Deliver'îles — Vous voulez le commander ? Chez nous vous pouvez.",
  description:
    "Deliver'îles, la marketplace locale nouvelle génération. Commandez chez vos commerçants de quartier, préparé par une IA, livré en temps réel.",
};

// Bandeau partenaires : lu côté serveur à chaque requête, directement depuis
// Supabase (table `partners`). Client anon public + RLS "visible par tous"
// suffisent ; pas de session utilisateur à propager ici.
// En mode démo (vars absentes ou table vide/absente), la landing garde son
// bandeau statique intégré.
async function getPartners(): Promise<Partner[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("partners")
      .select("name, category, color")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function Page() {
  const partners = await getPartners();
  return <LandingPage partners={partners ?? undefined} />;
}
