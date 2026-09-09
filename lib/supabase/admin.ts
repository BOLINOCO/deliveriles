import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client ADMIN (service_role) — serveur uniquement.
 *
 * Contournement total de la RLS : à réserver aux contextes de confiance
 * (webhook Stripe, backfills, opérations système). Ne jamais importer ce
 * module depuis un composant client.
 */
let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdminClient est réservé au serveur (service_role).");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, serviceRoleKey, {
      auth: {
        // Le service role n'a pas de session utilisateur à rafraîchir.
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedAdminClient;
}
