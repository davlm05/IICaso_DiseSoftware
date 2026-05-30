import type { ProductBadge } from '@/domain/models/types'
import { ProductDecorator } from './ProductDecorator'

/** Decorator concreto: agrega el badge 'sponsored' si el producto es patrocinado. */
export class SponsoredProductDecorator extends ProductDecorator {
  protected ownBadges(): ProductBadge[] {
    return this.product.sponsored ? ['sponsored'] : []
  }
}
