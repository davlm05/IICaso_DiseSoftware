import type { Product } from '@prisma/client';
import type { PointsConfig, ProductDTO } from '@smartcart/shared-types';

/**
 * Maps a Prisma Product row to the shared ProductDTO (README §2.4 — never
 * return Prisma types across the API boundary). `pointsConfig` is stored as
 * jsonb and surfaced as the discriminated-union PointsConfig.
 */
export function toProductDTO(row: Product): ProductDTO {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    imageUrl: row.imageUrl ?? undefined,
    pointsConfig: row.pointsConfig as unknown as PointsConfig,
    sponsored: row.sponsored,
  };
}
