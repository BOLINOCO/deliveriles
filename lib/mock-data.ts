import type { Product, Shop } from "./types";

// Données de démonstration. À remplacer par des requêtes Supabase
// (table `shops`, `products`) une fois le backend branché.

export const SHOPS: Shop[] = [
  {
    id: "shop_1",
    slug: "le-fournil",
    name: "Le Fournil",
    category: "Boulangerie",
    rating: 4.8,
    color: "#0F172A",
    distanceKm: 1.2,
    description: "Pain et viennoiseries artisanales, cuits chaque matin dès 5h.",
  },
  { id: "shop_2", slug: "marche-vert", name: "Marché Vert", category: "Fruits & légumes", rating: 4.9, color: "#0EA5E9", distanceKm: 2.4 },
  { id: "shop_3", slug: "cafe-lucie", name: "Café Lucie", category: "Café", rating: 4.7, color: "#F97316", distanceKm: 0.8 },
  { id: "shop_4", slug: "la-mercerie", name: "La Mercerie", category: "Loisirs créatifs", rating: 4.6, color: "#38BDF8", distanceKm: 3.1 },
  { id: "shop_5", slug: "boucherie-martin", name: "Boucherie Martin", category: "Boucherie", rating: 4.7, color: "#0F172A", distanceKm: 1.9 },
  { id: "shop_6", slug: "fleuriste-iris", name: "Fleuriste Iris", category: "Fleuriste", rating: 4.9, color: "#0EA5E9", distanceKm: 2.7 },
];

export const PRODUCTS: Product[] = [
  { id: "prod_1", shopId: "shop_1", name: "Croissant", price: 1.4, unit: "pièce", stock: 42 },
  { id: "prod_2", shopId: "shop_1", name: "Pain au chocolat", price: 1.5, unit: "pièce", stock: 35 },
  { id: "prod_3", shopId: "shop_1", name: "Café allongé", price: 2.5, unit: "pièce", stock: 999 },
  { id: "prod_4", shopId: "shop_1", name: "Baguette tradition", price: 1.2, unit: "pièce", stock: 3 },

  { id: "prod_5", shopId: "shop_2", name: "Panier de fruits de saison", price: 12.9, unit: "panier", stock: 18 },
  { id: "prod_6", shopId: "shop_2", name: "Avocats", price: 3.2, unit: "kg", stock: 26 },
  { id: "prod_7", shopId: "shop_2", name: "Tomates locales", price: 4.5, unit: "kg", stock: 0 },

  { id: "prod_8", shopId: "shop_3", name: "Café glacé", price: 4.8, unit: "pièce", stock: 999 },
  { id: "prod_9", shopId: "shop_3", name: "Chocolat chaud", price: 4.2, unit: "pièce", stock: 999 },

  { id: "prod_10", shopId: "shop_4", name: "Kit couture débutant", price: 18.9, unit: "kit", stock: 9 },
  { id: "prod_11", shopId: "shop_4", name: "Pelote de laine", price: 5.5, unit: "pièce", stock: 40 },

  { id: "prod_12", shopId: "shop_5", name: "Poulet fermier", price: 11.9, unit: "kg", stock: 14 },
  { id: "prod_13", shopId: "shop_5", name: "Boudin créole", price: 8.5, unit: "kg", stock: 22 },

  { id: "prod_14", shopId: "shop_6", name: "Bouquet du jour", price: 22.0, unit: "bouquet", stock: 7 },
  { id: "prod_15", shopId: "shop_6", name: "Orchidée en pot", price: 15.0, unit: "pièce", stock: 11 },
];

// Compte vendeur de démonstration (Bolinoco possède "Le Fournil").
// À remplacer par l'utilisateur authentifié (Supabase Auth) une fois branché.
export const CURRENT_VENDOR_SHOP_ID = "shop_1";
