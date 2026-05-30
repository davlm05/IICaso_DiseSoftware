/**
 * Eslabón 1: valida que el usuario esté dentro de una tienda afiliada.
 */
import type { ScanCheckResult, ScanContext } from '@/domain/models/types'
import { BaseScanHandler } from './ScanHandler'

export class LocationHandler extends BaseScanHandler {
  protected async check(ctx: ScanContext): Promise<ScanCheckResult | null> {
    if (ctx.store === null) {
      return { ok: false, code: 'LOCATION', reason: 'Debes estar dentro de una tienda afiliada' }
    }
    return null
  }
}
