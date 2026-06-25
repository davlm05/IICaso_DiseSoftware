import type { CouponDTO, ProductDTO, RewardDTO } from "../../types";

/**
 * Sponsored catalog mock — Domain layer (README §1.4). In production this is
 * the result of the Cache-Aside product lookup (TanStack Query over the
 * backend RPC), keyed by barcode.
 */
export const SPONSORED_PRODUCTS: ProductDTO[] = [
  {
    id: "p-cafe-britt-500",
    barcode: "7441001823000",
    name: "Cafe Britt 500g",
    brand: "Cafe Britt",
    price: 3250,
    points: 15,
    iconName: "Coffee",
    sponsored: true,
  },
  {
    id: "p-aceite-numar-1l",
    barcode: "7441002934111",
    name: "Aceite Numar 1L",
    brand: "Numar",
    price: 2890,
    points: 10,
    iconName: "Droplet",
    sponsored: true,
  },
  {
    id: "p-galletas-pozuelo",
    barcode: "7441003045222",
    name: "Galletas Pozuelo",
    brand: "Pozuelo",
    price: 1450,
    points: 8,
    iconName: "Cookie",
    sponsored: true,
  },
];

/**
 * RewardFactory products (README §1.4 Factory pattern, §1.9 /features/rewards/factories/).
 * Each entry is a reward "product" the factory can construct from a backend payload.
 */
export const REWARDS: RewardDTO[] = [
  {
    id: "r-descuento-15",
    name: "-15% en tu compra",
    description: "Válido en toda la tienda",
    cost: 100,
    expiresInDays: 30,
    highlighted: true,
  },
  {
    id: "r-2x1-cafe-britt",
    name: "2x1 en cafe Britt",
    description: "Lleva 2 paga 1 en cualquier presentación",
    cost: 75,
    expiresInDays: 30,
  },
  {
    id: "r-10-lacteos",
    name: "-10% en lacteos",
    description: "Descuento sobre el total en sección lácteos",
    cost: 50,
    expiresInDays: 15,
  },
  {
    id: "r-bono-5000",
    name: "Bono de 5,000 colones",
    description: "Para usar en tu siguiente compra",
    cost: 300,
    expiresInDays: 60,
  },
];

export const COUPONS: CouponDTO[] = [];

/**
 * Resolves a scanned barcode to a sponsored product.
 * Stand-in for the backend Cache-Aside lookup (README §1.5, operation 1).
 */
export function findProductByBarcode(barcode: string): ProductDTO | null {
  return SPONSORED_PRODUCTS.find((p) => p.barcode === barcode) ?? null;
}
