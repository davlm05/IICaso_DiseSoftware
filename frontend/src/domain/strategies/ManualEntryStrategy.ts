/**
 * Strategy: captura de barcode por ingreso manual.
 *
 * Valida que el código tenga exactamente 13 dígitos (EAN-13). Si no cumple,
 * lanza un Error; si cumple, resuelve el propio código.
 */
import type { BarcodeSource, IBarcodeInputStrategy } from '@/domain/models/types'

/** Patrón EAN-13: exactamente 13 dígitos. */
const EAN13_PATTERN = /^\d{13}$/

export class ManualEntryStrategy implements IBarcodeInputStrategy {
  readonly source: BarcodeSource = 'manual'

  /** Valida el `input` manual y lo resuelve si es un EAN-13 válido. */
  capture(input?: string): Promise<string> {
    if (input === undefined || !EAN13_PATTERN.test(input)) {
      throw new Error('Código inválido, deben ser 13 dígitos')
    }
    return Promise.resolve(input)
  }
}
