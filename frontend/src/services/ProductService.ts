/**
 * Servicio de productos (mock).
 *
 * Misma interfaz que el servicio real de Fase 3: hoy lee del catálogo simulado;
 * mañana hará peticiones HTTP vía `apiClient`. No expone detalles del mock.
 */
import type { Product } from '@/domain/models/types'
import { PRODUCT_CATALOG, SPONSORED_TODAY } from '@/services/mock/db'
import { delay } from '@/services/mock/delay'

export const ProductService = {
  /** Resuelve un barcode EAN-13 a un producto patrocinado, o null si no existe. */
  async resolveBarcode(barcode: string): Promise<Product | null> {
    await delay()
    return PRODUCT_CATALOG[barcode] ?? null
  },

  /** Productos destacados del carrusel "con puntos hoy" (mapeados del catálogo). */
  async getSponsoredToday(): Promise<Product[]> {
    await delay()
    return SPONSORED_TODAY.map((barcode) => PRODUCT_CATALOG[barcode]).filter(
      (product): product is Product => product !== undefined,
    )
  },
}
