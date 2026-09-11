import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Utilise le cookie store de Next.js : la session utilisateur circule via les
 * cookies (setAll est appelé par @supabase/ssr lors des rafraîchissements de token).
 *
 * Retourne `null` si les variables d'env ne sont pas définies.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Appelé depuis un Server Component rendu statique : l'écriture de
        // cookie est impossible ici, le middleware se charge du refresh.
      }
    },
  };

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieMethods,
  });
}
