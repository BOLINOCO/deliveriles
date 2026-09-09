export type Shop = {
  id: string;
  slug: string;
  name: string;
  category: string;
  rating: number;
  color: string;
  distanceKm: number;
  description?: string;
};

export type Product = {
  id: string;
  shopId: string;
  name: string;
  price: number;
  unit?: string;
  stock: number;
};

export type UserRoles = {
  isSeller: boolean;
  isCourier: boolean;
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  roles: UserRoles; // isBuyer est implicite : tout le monde peut acheter
  shopName?: string;
  shopCategory?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ComposedOrderItem = {
  productId: string;
  shopId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ComposedOrder = {
  shopSlug: string;
  shopName: string;
  items: ComposedOrderItem[];
  deliverySlot?: string;
  summary: string;
  pricing: {
    subtotal: number;
    delivery: number;
    commission: number;
    total: number;
  };
};
