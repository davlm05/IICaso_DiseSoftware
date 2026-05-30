/**
 * Servicio de ubicación / tienda (mock).
 *
 * En Fase 3 resolverá la tienda por GPS/BLE; hoy devuelve la tienda simulada.
 */
import type { Store } from '@/domain/models/types'
import { MOCK_STORE } from '@/services/mock/db'
import { delay } from '@/services/mock/delay'

export const LocationService = {
  /** Tienda actual del usuario. */
  async getCurrentStore(): Promise<Store> {
    await delay()
    return MOCK_STORE
  },
}
