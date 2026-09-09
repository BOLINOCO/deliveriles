import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Client Supabase côté navigateur (composants "use client").
 * Gère l'auth (localStorage), les requêtes PostgREST et les canaux Realtime.
 *
 * Retourne `null` si les variables d'env ne sont pas définies — les composants
 * appellent alors leur fallback démo au lieu de crasher.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
