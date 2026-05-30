/**
 * Servicio de validación por QR (mock).
 *
 * Respeta el contrato del futuro `QRValidationProxy` / `IPOSAdapter`: hoy simula
 * la confirmación de la "cajera" tras un retardo; mañana hará polling real al POS.
 */
import type { QrTicket, ScannedProduct, ValidationResult } from '@/domain/models/types'
import { env } from '@/config/env'

/** Genera un bloque de 4 chars en base36 mayúsculas a partir de un número. */
function block(value: number): string {
  return value.toString(36).toUpperCase().padStart(4, '0').slice(-4)
}

export const QrValidationService = {
  /**
   * Genera el ticket QR de validación. El código sigue el formato
   * `SC-2026-XXXX-XXXX` derivado del timestamp actual (determinístico, sin azar).
   */
  async generateQr(
    sessionId: string,
    productCount: number,
    pendingPoints: number,
  ): Promise<QrTicket> {
    const now = Date.now()
    // Dos bloques de 4: parte alta y parte baja del timestamp en base36.
    const code = `SC-2026-${block(Math.floor(now / 1_000))}-${block(now % 1_000_000)}`
    return {
      code,
      sessionId,
      productCount,
      pendingPoints,
      expiresAt: now + env.qrValidityMs,
    }
  },

  /**
   * Espera la validación automática del POS (simulada con setTimeout).
   * Resuelve acreditando los puntos ofrecidos por cada producto y marcándolos
   * como validados. Si `signal` aborta, limpia el timeout y rechaza.
   */
  awaitValidation(
    _ticket: QrTicket,
    products: ScannedProduct[],
    signal?: AbortSignal,
  ): Promise<ValidationResult> {
    return new Promise<ValidationResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const creditedPoints = products.reduce((sum, p) => sum + p.pointsOffered, 0)
        const validatedProducts = products.map((p) => ({ ...p, validated: true }))
        resolve({ validated: true, creditedPoints, validatedProducts })
      }, env.qrAutoValidateMs)

      // Cancelación cooperativa: limpia el timeout y rechaza.
      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        reject(new Error('Validación cancelada'))
      })
    })
  },
}
