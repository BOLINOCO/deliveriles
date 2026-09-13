import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de session Supabase (@supabase/ssr) :
 * rafraîchit les tokens expirés à chaque navigation et réécrit les cookies
 * de session. Sans lui, une session de plus d'une heure finit par expirer
 * côté serveur (getUser() renvoie null) alors que l'utilisateur est connecté.
 *
 * No-op quand Supabase n'est pas configuré (mode démo).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      supabaseResponse = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options)
      );
    },
  };

  const supabase = createServerClient(url, key, {
    cookies: cookieMethods,
  });

  // IMPORTANT : ne pas retirer — déclenche le refresh des tokens expirés.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Supabase JS n'est pas compatible Edge Runtime (référence process.version
  // au top-level → MIDDLEWARE_INVOCATION_FAILED sur Vercel) : on force le
  // runtime Node.js, stable pour le middleware depuis Next 15.5.
  runtime: "nodejs",
  matcher: [
    // Tout sauf les assets statiques.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
