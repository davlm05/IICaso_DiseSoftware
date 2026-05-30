import type { ProductBadge, Reward, ScannedProduct } from '@/domain/models/types'
import { NewlyScannedDecorator } from './NewlyScannedDecorator'
import { LockedRewardDecorator } from './LockedRewardDecorator'
import { ProductDecorator } from './ProductDecorator'
import { SponsoredProductDecorator } from './SponsoredProductDecorator'
import { ValidatedProductDecorator } from './ValidatedProductDecorator'

export { ProductDecorator } from './ProductDecorator'
export { SponsoredProductDecorator } from './SponsoredProductDecorator'
export { NewlyScannedDecorator } from './NewlyScannedDecorator'
export { ValidatedProductDecorator } from './ValidatedProductDecorator'
export { LockedRewardDecorator } from './LockedRewardDecorator'

/**
 * Compone los 3 decoradores de producto y devuelve los badges visuales.
 * Orden: sponsored -> new -> validated.
 */
export function getProductBadges(product: ScannedProduct): ProductBadge[] {
  const decorated: ProductDecorator = new ValidatedProductDecorator(
    product,
    new NewlyScannedDecorator(product, new SponsoredProductDecorator(product)),
  )
  return decorated.badges()
}

/** Estado de bloqueo de una recompensa según los puntos actuales. */
export function getRewardLockState(
  reward: Reward,
  currentPoints: number,
): { locked: boolean; missing: number } {
  const decorator = new LockedRewardDecorator({ reward, currentPoints })
  return { locked: decorator.isLocked(), missing: decorator.missingPoints() }
}
