import type { ProductDTO } from '@smartcart/shared-types';

/**
 * Catalog read API (README §2.4 /products). In the full design these reads are
 * Cache-Aside over Redis; the MVP serves straight from Postgres.
 */
export interface ICatalogService {
  findByBarcode(barcode: string): Promise<ProductDTO>;
  search(query: string, limit: number): Promise<ProductDTO[]>;
}

export const CATALOG_SERVICE = Symbol('CATALOG_SERVICE');
