import { Module } from '@nestjs/common';
import { CatalogService } from './application/services/catalog.service';
import { ProductsController } from './presentation/controllers/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
