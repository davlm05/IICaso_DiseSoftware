import { Injectable } from '@nestjs/common';
import type { Product as ProductRow } from '@prisma/client';
import type { PointsConfig, ProductDTO } from '@smartcart/shared-types';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { IProductRepository } from '../../application/interfaces/product-repository.interface';

/** Prisma-backed product repository (README §2.2 Rule 3, §2.4 Product model). */
@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarcode(barcode: string): Promise<ProductDTO | null> {
    const row = await this.prisma.product.findUnique({ where: { barcode } });
    return row ? PrismaProductRepository.toDto(row) : null;
  }

  async search(query: string, limit: number): Promise<ProductDTO[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
    return rows.map((r) => PrismaProductRepository.toDto(r));
  }

  /** Map a row to the API DTO; `pointsConfig` (Json) is the strategy discriminator. */
  private static toDto(row: ProductRow): ProductDTO {
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
}
