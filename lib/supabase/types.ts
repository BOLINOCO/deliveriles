export type ShopRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  color: string;
  rating: number;
  distance_km: number | null;
  created_at: string;
};

export type ProductRow = {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  unit: string | null;
  stock: number;
  created_at: string;
};

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

export type DeliveryStatus = "pending" | "accepted" | "picked_up" | "delivered";

export type OrderRow = {
  id: string;
  buyer_id: string;
  shop_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number; // part livreur (80% des frais de livraison)
  platform_commission: number; // part plateforme (20%)
  total: number;
  delivery_address: string;
  distance_km: number;
  cart_size: "SMALL" | "MEDIUM" | "LARGE";
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type DeliveryRow = {
  id: string;
  order_id: string;
  courier_id: string | null;
  status: DeliveryStatus;
  driver_earnings: number;
  platform_commission: number;
  courier_lat: number | null;
  courier_lng: number | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  is_seller: boolean;
  is_courier: boolean;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  profile_id: string;
  type: "vendeur" | "livreur_premium";
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at: string;
};

/** Résultat d'un appel RPC (place_order / accept_delivery / etc.) */
export type RpcResult<T> = { data: T | null; error: string | null };
