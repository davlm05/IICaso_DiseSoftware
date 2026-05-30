import type { ProductBadge, ScannedProduct } from '@/domain/models/types'

/**
 * Decorator (GoF) — clase base abstracta para estados visuales de producto.
 *
 * Envuelve un `ScannedProduct` (o a otro decorador) y compone la lista de
 * badges: delega en el envuelto y agrega su propio distintivo. Las subclases
 * sólo implementan `ownBadges()` con la lógica de su badge concreto.
 */
export abstract class ProductDecorator {
  protected readonly wrapped: ProductDecorator | null
  protected readonly product: ScannedProduct

  /**
   * @param product Producto base sobre el que operan todos los decoradores.
   * @param wrapped Decorador anidado (null en la base de la cadena).
   */
  constructor(product: ScannedProduct, wrapped: ProductDecorator | null = null) {
    this.product = product
    this.wrapped = wrapped
  }

  /** Badges aportados sólo por este decorador (sin los del envuelto). */
  protected abstract ownBadges(): ProductBadge[]

  /** Badges compuestos: los del decorador envuelto seguidos de los propios. */
  badges(): ProductBadge[] {
    const inherited = this.wrapped ? this.wrapped.badges() : []
    return [...inherited, ...this.ownBadges()]
  }
}
