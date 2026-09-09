import { createServerClient } from "@supabase/ssr";
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

  const supabase = createServerClient(url, key, {
    cookies: {
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
    },
  });

  // IMPORTANT : ne pas retirer — déclenche le refresh des tokens expirés.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Tout sauf les assets statiques.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
