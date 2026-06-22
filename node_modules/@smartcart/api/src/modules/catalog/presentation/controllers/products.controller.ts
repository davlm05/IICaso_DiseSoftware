import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { CatalogService } from '../../application/services/catalog.service';

/** Product lookup endpoints (README §2.4 / §2.8 Workflow 4 step 2). */
@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  // Declared before ':barcode' so "search" is not captured as a barcode.
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.catalog.search(q ?? '', limit);
  }

  @Get(':barcode')
  getByBarcode(@Param('barcode') barcode: string) {
    return this.catalog.getByBarcode(barcode);
  }
}
