import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDTO } from '@smartcart/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { toProductDTO } from '../../infrastructure/mappers/product.mapper';
import type { ICatalogService } from '../interfaces/catalog-service.interface';

/**
 * Product lookup (README §2.4 /products/:barcode, /products/search).
 */
@Injectable()
export class CatalogService implements ICatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarcode(barcode: string): Promise<ProductDTO> {
    const product = await this.prisma.product.findUnique({ where: { barcode } });
    if (!product) throw new NotFoundException(`No product for barcode ${barcode}`);
    return toProductDTO(product);
  }

  async search(query: string, limit: number): Promise<ProductDTO[]> {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
    return products.map(toProductDTO);
  }
}
