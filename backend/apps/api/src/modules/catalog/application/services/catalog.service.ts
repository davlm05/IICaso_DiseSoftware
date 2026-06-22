import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDTO } from '@smartcart/shared-types';
import { RedisService } from '../../../../common/redis/redis.service';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../interfaces/product-repository.interface';
import type { ICatalogService } from '../interfaces/catalog-service.interface';

const PRODUCT_TTL = 3600; // 1h (README §2.4 GET /products/:barcode)
const SEARCH_TTL = 300; // 5 min (README §2.4 GET /products/search)
const productKey = (barcode: string) => `product:${barcode}`;
const searchKey = (q: string, limit: number) => `product:search:${q}:${limit}`;

/**
 * Catalog service — Cache-Aside product lookup (README §2.4, §2.8 Workflow 4.2).
 * Implements the cross-module `ICatalogService` port used by Checkout.
 */
@Injectable()
export class CatalogService implements ICatalogService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    private readonly redis: RedisService,
  ) {}

  async getByBarcode(barcode: string): Promise<ProductDTO> {
    const cached = await this.redis.get(productKey(barcode));
    if (cached) return JSON.parse(cached) as ProductDTO;

    const product = await this.products.findByBarcode(barcode);
    if (!product) throw new NotFoundException('Product not found.');

    await this.redis.set(
      productKey(barcode),
      JSON.stringify(product),
      'EX',
      PRODUCT_TTL,
    );
    return product;
  }

  async search(query: string, limit = 20): Promise<ProductDTO[]> {
    const cached = await this.redis.get(searchKey(query, limit));
    if (cached) return JSON.parse(cached) as ProductDTO[];

    const results = await this.products.search(query, limit);
    await this.redis.set(
      searchKey(query, limit),
      JSON.stringify(results),
      'EX',
      SEARCH_TTL,
    );
    return results;
  }
}
