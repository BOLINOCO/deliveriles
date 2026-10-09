import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Shop } from "@/lib/types";

/**
 * GET /api/shops — catalogue public des boutiques (table `shops`).
 * Lecture publique (policy 0001). 503 quand Supabase n'est pas configuré :
 * le front bascule alors silencieusement sur ses données de démo.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("shops")
    .select("id, slug, name, category, description, color, rating, distance_km")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur lecture shops:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  const shops: Shop[] = (data ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category,
    rating: Number(s.rating),
    color: s.color,
    distanceKm: Number(s.distance_km ?? 0),
    description: s.description ?? undefined,
  }));

  return NextResponse.json({ shops });
}
