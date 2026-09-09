/**
 * Configuration Supabase centralisée.
 *
 * L'app fonctionne en deux modes :
 *  - "connecté" : NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY définies →
 *    toutes les données passent par Supabase (auth, orders, deliveries, realtime…).
 *  - "démo" : variables absentes → l'UI garde son comportement mock, sans crash.
 *
 * La clé service_role ne doit JAMAIS être préfixée NEXT_PUBLIC_ : elle n'est lue
 * que côté serveur (webhooks Stripe, opérations privilégiées).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
