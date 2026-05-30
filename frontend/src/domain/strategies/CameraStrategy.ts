/**
 * Strategy: captura de barcode por cámara (simulada).
 *
 * No usa aleatoriedad: rota de forma determinista sobre SPONSORED_TODAY
 * mediante un contador interno, devolviendo un barcode distinto en cada lectura.
 */
import type { BarcodeSource, IBarcodeInputStrategy } from '@/domain/models/types'
import { SPONSORED_TODAY } from '@/services/mock/db'

/**
 * Cursor de rotación a nivel de módulo: persiste entre instancias (cada visita a
 * la pantalla de cámara crea una nueva CameraStrategy) para que lecturas
 * sucesivas devuelvan productos distintos en lugar de repetir el primero.
 */
let cursor = 0

export class CameraStrategy implements IBarcodeInputStrategy {
  readonly source: BarcodeSource = 'camera'

  /** Simula la lectura: devuelve barcodes de SPONSORED_TODAY en orden rotativo. */
  capture(): Promise<string> {
    const barcode = SPONSORED_TODAY[cursor % SPONSORED_TODAY.length]
    cursor += 1
    return Promise.resolve(barcode)
  }
}
