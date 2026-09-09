/**
 * deliver'iles - Pricing Engine
 * Fichier: delivery-pricing.ts
 * Description: Algorithme de calcul des frais de livraison avec répartition 80% Livreur / 20% Plateforme,
 *              incluant le bonus TERRAIN (montées de Basse-Terre) appliqué à la composante distance.
 */

// --- 1. TYPES ET INTERFACES ---

export type CartSize = "SMALL" | "MEDIUM" | "LARGE";

export type TerrainZone = "PLATE" | "HILLY" | "STEEP";

export interface DeliveryConditions {
  isRaining: boolean;
  isNight: boolean;
  isHighDemand: boolean;
}

export interface FeeBreakdown {
  totalCustomerFee: number; // Ce que paie le client
  driverEarnings: number; // 80% pour le livreur
  platformCommission: number; // 20% pour deliver'iles
  terrain: TerrainZone; // zone de relief appliquée (transparence)
}

// --- 2. CONSTANTES DE TARIFICATION ---

const PRICING = {
  BASE_FEE: 2.5, // Prise en charge minimum garantie
  PER_KM_RATE: 1.2, // Rémunération au kilomètre
  CONDITION_BONUS: 1.5, // Bonus fixe par condition difficile
  SIZE_MULTIPLIER: {
    SMALL: 1.0, // Repas, petits sacs
    MEDIUM: 1.25, // Courses classiques
    LARGE: 1.5, // Packs d'eau, objets encombrants
  },
  DRIVER_SHARE: 0.8, // 80%
  PLATFORM_SHARE: 0.2, // 20%
};

/**
 * Bonus TERRAIN — appliqué uniquement à la composante distance (le km coûte
 * plus cher en montée : temps, carburant, usure), jamais à la prise en charge.
 *  - PLATE  ×1.00 : Grande-Terre, plaine, côte (Abymes, Gosier, Moule…)
 *  - HILLY  ×1.15 : contreforts de Basse-Terre (Basse-Terre ville, Petit-Bourg
 *                   hauteur, Capesterre-Belle-Eau, Sainte-Rose…)
 *  - STEEP  ×1.35 : pitons et routes de crête (Saint-Claude/Matouba, Bouillante,
 *                   Vieux-Habitants, Pointe-Noire, Trois-Rivières, Deshaies…)
 */
export const TERRAIN_ZONES: Record<
  TerrainZone,
  { label: string; distanceMultiplier: number }
> = {
  PLATE: { label: "Plat", distanceMultiplier: 1.0 },
  HILLY: { label: "Collines", distanceMultiplier: 1.15 },
  STEEP: { label: "Montée", distanceMultiplier: 1.35 },
};

// Communes en zone de montée (adresses normalisées : minuscules, sans accents).
// Mirroir SQL exact dans supabase/migrations/0002 (get_delivery_terrain).
const STEEP_COMMUNES = [
  "saint-claude",
  "matouba",
  "bouillante",
  "vieux-habitants",
  "pointe-noire",
  "trois-rivieres",
  "deshaies",
  "baillif",
  "gourbeyre",
];

const HILLY_COMMUNES = [
  "basse-terre", // ville en flanc de morne
  "capesterre", // couvre aussi capesterre-belle-eau
  "petit-bourg", // hauteurs (Spiral…)
  "sainte-rose",
  "goyave",
];

// --- 2bis. RÉSOLUTION DE LA ZONE DE RELIEF ---

/** Normalise une adresse : minuscules + accents retirés, pour matching fiable. */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Zone de relief déduite de l'adresse de livraison (recherche par commune).
 * La route reste maître : en cas d'ambiguïté, surchargez avec l'altitude réelle
 * (terrainFromAltitude) une fois le géocodage branché.
 */
export function getDeliveryTerrain(address: string): TerrainZone {
  const normalized = normalizeAddress(address);
  if (STEEP_COMMUNES.some((c) => normalized.includes(c))) return "STEEP";
  if (HILLY_COMMUNES.some((c) => normalized.includes(c))) return "HILLY";
  return "PLATE";
}

/**
 * Variante altitude (pour plus tard : géocodage → altitude m).
 * Seuils calés sur les montées guadeloupéennes.
 */
export function terrainFromAltitude(altitudeM: number): TerrainZone {
  if (altitudeM >= 350) return "STEEP";
  if (altitudeM >= 150) return "HILLY";
  return "PLATE";
}

// --- 3. FONCTION PRINCIPALE ---

/**
 * Calcule les frais de livraison et la répartition financière.
 * @param distanceKm Distance réelle du trajet en kilomètres.
 * @param size Encombrement de la commande.
 * @param conditions Conditions météorologiques ou de demande.
 * @param terrain Zone de relief (montées de Basse-Terre). Défaut : PLATE.
 * @returns Objet contenant le prix total, le gain livreur et la commission plateforme.
 */
export function calculateDeliveryFee(
  distanceKm: number,
  size: CartSize,
  conditions: DeliveryConditions,
  terrain: TerrainZone = "PLATE"
): FeeBreakdown {
  // 1. Calcul de base : prise en charge + distance ALOURDIE par le relief
  //    (le bonus montée porte sur le km, pas sur la prise en charge).
  const terrainMultiplier = TERRAIN_ZONES[terrain].distanceMultiplier;
  const baseDistanceFee =
    PRICING.BASE_FEE + distanceKm * PRICING.PER_KM_RATE * terrainMultiplier;

  // 2. Application du multiplicateur d'encombrement
  let totalFee = baseDistanceFee * PRICING.SIZE_MULTIPLIER[size];

  // 3. Ajout des bonus de conditions (nuit, pluie, forte demande)
  let activeConditions = 0;
  if (conditions.isRaining) activeConditions++;
  if (conditions.isNight) activeConditions++;
  if (conditions.isHighDemand) activeConditions++;

  totalFee += activeConditions * PRICING.CONDITION_BONUS;

  // 4. Arrondi du total à 2 décimales
  totalFee = Math.round(totalFee * 100) / 100;

  // 5. Répartition 80/20
  const driverEarnings = Math.round(totalFee * PRICING.DRIVER_SHARE * 100) / 100;
  // On soustrait le gain du livreur au total pour éviter les erreurs d'arrondi sur la commission
  const platformCommission = Math.round((totalFee - driverEarnings) * 100) / 100;

  return {
    totalCustomerFee: totalFee,
    driverEarnings,
    platformCommission,
    terrain,
  };
}

// --- 4. HELPERS DE CONDITIONS (dérivées de l'heure serveur en attendant une vraie API météo/demande) ---

export function getCurrentConditions(): DeliveryConditions {
  const hour = new Date().getHours();
  return {
    isRaining: false, // TODO: brancher une API météo (ex. OpenWeather) selon la position du shop
    isNight: hour >= 21 || hour < 7,
    isHighDemand: (hour >= 12 && hour < 14) || (hour >= 19 && hour < 21), // coups de feu déjeuner/dîner
  };
}

export function cartSizeFromQuantity(totalQuantity: number): CartSize {
  if (totalQuantity <= 3) return "SMALL";
  if (totalQuantity <= 8) return "MEDIUM";
  return "LARGE";
}
