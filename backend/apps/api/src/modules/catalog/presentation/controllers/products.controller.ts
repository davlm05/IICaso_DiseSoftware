import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BarcodeSchema } from '@smartcart/shared-types';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CatalogService } from '../../application/services/catalog.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  // NOTE: declared before ':barcode' so "search" is not captured as a barcode.
  @Get('search')
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.catalog.search(q.trim(), limit ? Number(limit) : 20);
  }

  @Get(':barcode')
  byBarcode(@Param('barcode') barcode: string) {
    const parsed = BarcodeSchema.safeParse(barcode);
    if (!parsed.success) throw new BadRequestException('Invalid barcode');
    return this.catalog.findByBarcode(parsed.data);
  }
}
