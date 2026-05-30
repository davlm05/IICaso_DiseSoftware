/**
 * Eslabón 3: resuelve el producto en el catálogo y valida que sea patrocinado.
 * En éxito propaga el `product` resuelto hacia el resto de la cadena.
 */
import type { ScanCheckResult, ScanContext } from '@/domain/models/types'
import { PRODUCT_CATALOG } from '@/services/mock/db'
import { BaseScanHandler } from './ScanHandler'

export class SponsoredProductHandler extends BaseScanHandler {
  protected async check(ctx: ScanContext): Promise<ScanCheckResult | null> {
    const product = PRODUCT_CATALOG[ctx.barcode]
    if (!product || !product.sponsored) {
      return { ok: false, code: 'NOT_SPONSORED', reason: 'Este producto no participa' }
    }
    return { ok: true, product }
  }
}
