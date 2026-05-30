/**
 * Eslabón 2: valida el formato del barcode (EAN-13: 13 dígitos).
 */
import type { ScanCheckResult, ScanContext } from '@/domain/models/types'
import { BaseScanHandler } from './ScanHandler'

export class BarcodeFormatHandler extends BaseScanHandler {
  protected async check(ctx: ScanContext): Promise<ScanCheckResult | null> {
    if (!/^\d{13}$/.test(ctx.barcode)) {
      return { ok: false, code: 'FORMAT', reason: 'Código de barras inválido' }
    }
    return null
  }
}
