import type { ProductBadge } from '@/domain/models/types'
import { ProductDecorator } from './ProductDecorator'

/** Decorator concreto: agrega el badge 'validated' si el producto fue validado en caja. */
export class ValidatedProductDecorator extends ProductDecorator {
  protected ownBadges(): ProductBadge[] {
    return this.product.validated ? ['validated'] : []
  }
}
