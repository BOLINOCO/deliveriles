import {
  calculateDeliveryFee,
  cartSizeFromQuantity,
  getCurrentConditions,
  getDeliveryTerrain,
  type DeliveryConditions,
  type TerrainZone,
} from "./delivery-pricing";

export type OrderPricing = {
  subtotal: number; // prix produits
  delivery: number; // part reversée au livreur (80% des frais de livraison)
  commission: number; // part plateforme sur la livraison (20%)
  total: number; // prix final affiché à l'acheteur
  terrain: TerrainZone; // zone de relief appliquée (montées Basse-Terre)
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcule le prix final transparent d'une commande :
 * Prix produit + Livraison (part livreur) + Commission plateforme (part sur la livraison).
 * Le vendeur touche toujours 100% du prix produit — 0% de commission dessus.
 * La commission plateforme ne porte que sur les frais de livraison (répartition 80/20).
 *
 * `deliveryAddress` : l'adresse du client détermine la zone de relief (montées
 * de Basse-Terre → km alourdi). En l'absence d'adresse, terrain plat par défaut.
 */
export function computeOrderTotal(
  subtotal: number,
  distanceKm: number,
  totalQuantity: number,
  conditions: DeliveryConditions = getCurrentConditions(),
  deliveryAddress?: string,
  terrain?: TerrainZone
): OrderPricing {
  const size = cartSizeFromQuantity(totalQuantity);
  const resolvedTerrain = terrain ?? getDeliveryTerrain(deliveryAddress ?? "");
  const { driverEarnings, platformCommission, totalCustomerFee } = calculateDeliveryFee(
    distanceKm,
    size,
    conditions,
    resolvedTerrain
  );

  return {
    subtotal: round2(subtotal),
    delivery: driverEarnings,
    commission: platformCommission,
    total: round2(subtotal + totalCustomerFee),
    terrain: resolvedTerrain,
  };
}
