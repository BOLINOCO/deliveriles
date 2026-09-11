/**
 * Point d'entrée "client-safe" de la couche Supabase.
 *
 * ⚠️ N'exportez JAMAIS ici les modules `./server` ou `./admin` : ils
 * dépendent de `next/headers` / clés privilégiées et casserait le build
 * dès qu'un composant client importe ce barrel.
 *
 * - Côté client / composants "use client" : `getSupabaseBrowserClient`.
 * - Côté serveur (pages serveur, API routes) : importez directement
 *   `@/lib/supabase/server` ou `@/lib/supabase/admin`.
 */
export { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";
export { getSupabaseBrowserClient } from "./browser";
export type {
  ShopRow,
  ProductRow,
  OrderRow,
  OrderItemRow,
  DeliveryRow,
  ProfileRow,
  SubscriptionRow,
  OrderStatus,
  DeliveryStatus,
  RpcResult,
} from "./types";
