export { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";
export { getSupabaseBrowserClient } from "./browser";
export { getSupabaseServerClient } from "./server";
export { getSupabaseAdminClient } from "./admin";
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
