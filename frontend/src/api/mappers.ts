import type {
  BackendProduct,
  BackendReward,
  BackendSessionItem,
  PointsConfig,
  ProductDTO,
  RewardDTO,
} from "../types";

/**
 * Mapping layer between the backend contracts and the display DTOs the screens
 * read (CLAUDE.md "Contract mismatches to handle"):
 *
 *  - `price` and `iconName` don't exist in the backend schema, so they come
 *    from a client-side `barcode → meta` table (seeded products) with sane
 *    fallbacks for unknown barcodes.
 *  - `points` is authoritative only as `pointsValue` on a session line item
 *    (computed by the server points Strategy). For carousel/scan previews we
 *    derive a display value from `pointsConfig`.
 *  - Session items carry no name/brand; a small in-memory cache (seeded from
 *    the meta table and filled as products are fetched) supplies them.
 */

interface ProductMeta {
  name: string;
  brand: string;
  price: number;
  iconName: string;
  sponsored: boolean;
}

/** Seeded catalog (barcodes from backend/apps/api/prisma/seed.ts). */
export const PRODUCT_META: Record<string, ProductMeta> = {
  "7441001823000": { name: "Cafe Britt 500g", brand: "Cafe Britt", price: 3250, iconName: "Coffee", sponsored: true },
  "7441002934111": { name: "Aceite Numar 1L", brand: "Numar", price: 2890, iconName: "Droplet", sponsored: true },
  "7441003045222": { name: "Galletas Pozuelo", brand: "Pozuelo", price: 1450, iconName: "Cookie", sponsored: true },
  "7441234567890": { name: "Leche Dos Pinos 1L", brand: "Dos Pinos", price: 1200, iconName: "Milk", sponsored: false },
  "7441004056333": { name: "Arroz Tio Pelon 1kg", brand: "Tio Pelon", price: 1100, iconName: "Wheat", sponsored: false },
  "7441005067444": { name: "Pinto Express", brand: "Casa", price: 1800, iconName: "Utensils", sponsored: false },
};

const DEFAULT_ICON = "Package";

/** Best-effort display points from a pointsConfig (carousel / scan preview). */
export function displayPoints(config: PointsConfig): number {
  switch (config.type) {
    case "FIXED_PER_UNIT":
    case "SPEND_MULTIPLIER":
      return config.value;
    case "VOLUME_TIER":
      return config.tiers[0]?.pointsPerUnit ?? 0;
    case "WEEKEND_BONUS":
      return config.basePoints;
    default:
      return 0;
  }
}

/** Backend product → display ProductDTO. */
export function mapBackendProduct(bp: BackendProduct): ProductDTO {
  const meta = PRODUCT_META[bp.barcode];
  const product: ProductDTO = {
    id: bp.id,
    barcode: bp.barcode,
    name: bp.name,
    brand: bp.brand,
    price: meta?.price ?? 0,
    points: displayPoints(bp.pointsConfig),
    iconName: meta?.iconName ?? DEFAULT_ICON,
    sponsored: bp.sponsored,
  };
  cacheProduct(product);
  return product;
}

// ── Product cache (barcode → display product) ─────────────────────────────────
// Lets `buildPendingItems` resolve names/icons for session line items, which
// the backend returns without those fields.
const productCache = new Map<string, ProductDTO>();

// Seed from the meta table so an existing session restored on app start
// (GET /sessions/active) renders with real names without N product fetches.
for (const [barcode, meta] of Object.entries(PRODUCT_META)) {
  productCache.set(barcode, {
    id: barcode,
    barcode,
    name: meta.name,
    brand: meta.brand,
    price: meta.price,
    points: 0,
    iconName: meta.iconName,
    sponsored: meta.sponsored,
  });
}

export function cacheProduct(product: ProductDTO): void {
  productCache.set(product.barcode, product);
}

/** Session line items → display products (authoritative points = pointsValue). */
export function buildPendingItems(items: BackendSessionItem[]): ProductDTO[] {
  return items.map((item) => {
    const base = productCache.get(item.barcode);
    return {
      id: item.productId,
      itemId: item.id,
      barcode: item.barcode,
      name: base?.name ?? `Producto ${item.barcode}`,
      brand: base?.brand ?? "",
      price: base?.price ?? 0,
      points: item.pointsValue,
      iconName: base?.iconName ?? DEFAULT_ICON,
      sponsored: base?.sponsored ?? false,
    };
  });
}

/** Backend reward → display RewardDTO (highlighted/expiresInDays are derived). */
export function mapReward(br: BackendReward, highlighted = false): RewardDTO {
  return {
    id: br.id,
    name: br.name,
    description: br.description,
    cost: br.cost,
    highlighted,
  };
}
