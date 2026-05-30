/**
 * Eslabón 4: evita escanear dos veces el mismo producto en la sesión.
 */
import type { ScanCheckResult, ScanContext } from '@/domain/models/types'
import { BaseScanHandler } from './ScanHandler'

export class DuplicateScanHandler extends BaseScanHandler {
  protected async check(ctx: ScanContext): Promise<ScanCheckResult | null> {
    if (ctx.existingBarcodes.includes(ctx.barcode)) {
      return { ok: false, code: 'DUPLICATE', reason: 'Ya escaneaste este producto' }
    }
    return null
  }
}
