/**
 * Chain of Responsibility — clase base de los handlers de validación de escaneo.
 *
 * Cada eslabón implementa `check`; la cadena se detiene ante el primer rechazo.
 * Si todos pasan, propaga `ok:true` y arrastra el `product` resuelto por algún
 * eslabón (p. ej. SponsoredProductHandler).
 */
import type { ScanCheckResult, ScanContext, ScanHandler } from '@/domain/models/types'

export abstract class BaseScanHandler implements ScanHandler {
  /** Siguiente eslabón de la cadena (null = fin). */
  private next: ScanHandler | null = null

  /** Encadena el siguiente handler y lo retorna para permitir fluidez. */
  setNext(handler: ScanHandler): ScanHandler {
    this.next = handler
    return handler
  }

  /** Ejecuta este eslabón y delega en el siguiente si no hay rechazo. */
  async handle(ctx: ScanContext): Promise<ScanCheckResult> {
    const r = await this.check(ctx)
    // Rechazo: detiene la cadena.
    if (r && !r.ok) return r
    // Continúa con el siguiente eslabón, conservando el product resuelto.
    if (this.next) {
      const down = await this.next.handle(ctx)
      return {
        ok: down.ok,
        code: down.code,
        reason: down.reason,
        product: down.product ?? r?.product,
      }
    }
    // Fin de la cadena: éxito.
    return r ?? { ok: true }
  }

  /** Verificación del eslabón. `null` = sin objeción, continúa la cadena. */
  protected abstract check(ctx: ScanContext): Promise<ScanCheckResult | null>
}
