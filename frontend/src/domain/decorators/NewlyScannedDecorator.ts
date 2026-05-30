import type { ProductBadge } from '@/domain/models/types'
import { ProductDecorator } from './ProductDecorator'

/** Decorator concreto: agrega el badge 'new' si el producto es el recién escaneado. */
export class NewlyScannedDecorator extends ProductDecorator {
  protected ownBadges(): ProductBadge[] {
    return this.product.isNew ? ['new'] : []
  }
}
