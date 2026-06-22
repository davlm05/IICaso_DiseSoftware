import type { ProductDTO } from '@smartcart/shared-types';

/** Product persistence port (README §2.2 Rule 3). Returns DTOs, never rows. */
export const PRODUCT_REPOSITORY = 'IProductRepository';

export interface IProductRepository {
  findByBarcode(barcode: string): Promise<ProductDTO | null>;
  search(query: string, limit: number): Promise<ProductDTO[]>;
}
