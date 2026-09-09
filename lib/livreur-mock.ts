import { SHOPS } from "./mock-data";
import {
  calculateDeliveryFee,
  getCurrentConditions,
  getDeliveryTerrain,
  type CartSize,
  type TerrainZone,
} from "./delivery-pricing";

export type Course = {
  id: string;
  shopId: string;
  buyerAddress: string;
  distanceKm: number;
  cartSize: CartSize;
  itemsSummary: string;
  // Renseignés pour les courses réelles (Supabase) — ignorés en mode démo :
  shopName?: string;
  shopColor?: string;
  driverEarnings?: number;
  deliveryStatus?: "pending" | "accepted" | "picked_up" | "delivered";
  // Zone de relief (montées Basse-Terre) ; déduite de l'adresse si absente.
  terrain?: TerrainZone;
};

// Démonstration : à remplacer par les commandes réelles en attente de livreur
// (table `deliveries`, filtrée par proximité géographique côté Supabase).
export const PENDING_COURSES: Course[] = [
  {
    id: "course_1",
    shopId: "shop_1",
    buyerAddress: "12 rue des Flamboyants, Le Gosier",
    distanceKm: 1.8,
    cartSize: "SMALL",
    itemsSummary: "2 croissants, 1 café allongé",
  },
  {
    id: "course_2",
    shopId: "shop_2",
    buyerAddress: "5 allée des Cocotiers, Le Gosier",
    distanceKm: 3.2,
    cartSize: "MEDIUM",
    itemsSummary: "1 panier de fruits, 2kg de tomates",
  },
  {
    id: "course_3",
    shopId: "shop_5",
    buyerAddress: "8 chemin de la Marina, Le Gosier",
    distanceKm: 4.6,
    cartSize: "LARGE",
    itemsSummary: "3kg de poulet fermier, boudin créole",
  },
];

export function getCourseById(id: string): Course | undefined {
  return PENDING_COURSES.find((c) => c.id === id);
}

export function getCourseShop(course: Course) {
  return SHOPS.find((s) => s.id === course.shopId);
}

export function getCourseEarnings(course: Course) {
  const terrain = course.terrain ?? getDeliveryTerrain(course.buyerAddress);
  return calculateDeliveryFee(
    course.distanceKm,
    course.cartSize,
    getCurrentConditions(),
    terrain
  );
}
