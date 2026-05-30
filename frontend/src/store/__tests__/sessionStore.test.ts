/**
 * Tests unitarios de sessionStore.
 *
 * Cubre el ciclo de la sesión de compra: escaneo de productos (addScannedProduct),
 * derivación de puntos pendientes (selectPendingPoints), eliminación (removeProduct),
 * confirmación idempotente de la validación (confirmValidation) y reinicio (reset).
 *
 * sessionStore es singleton y comparte el commandBus y el pointsStore (también
 * singletons), por lo que ambos se resetean antes de cada test.
 */
import { useSessionStore } from '@/store/sessionStore'
import { usePointsStore } from '@/store/pointsStore'
import { selectPendingPoints } from '@/store/selectors'
import { PRODUCT_CATALOG, MOCK_STORE } from '@/services/mock/db'
import type { Product, ValidationResult } from '@/domain/models/types'

// Productos reales del catálogo para alimentar addScannedProduct.
const BRITT: Product = PRODUCT_CATALOG['7441001823456'] // 15 pts
const NUMAR: Product = PRODUCT_CATALOG['7441002910001'] // 10 pts

describe('sessionStore', () => {
  // Resetea la sesión, la tienda y el saldo de puntos antes de cada test.
  beforeEach(() => {
    useSessionStore.getState().reset()
    useSessionStore.getState().setStore(MOCK_STORE)
    usePointsStore.getState().reset()
  })

  describe('addScannedProduct', () => {
    it('agrega una línea escaneada con scanId e isNew=true', () => {
      useSessionStore.getState().addScannedProduct(BRITT)

      const { products } = useSessionStore.getState()
      expect(products).toHaveLength(1)
      const linea = products[0]
      expect(linea.scanId).toEqual(expect.any(String))
      expect(linea.scanId.length).toBeGreaterThan(0)
      expect(linea.isNew).toBe(true)
      expect(linea.validated).toBe(false)
      // Conserva los datos del producto del catálogo.
      expect(linea.id).toBe(BRITT.id)
      expect(linea.pointsOffered).toBe(BRITT.pointsOffered)
    })

    it('marca isNew=false en los productos previos al escanear uno nuevo', () => {
      useSessionStore.getState().addScannedProduct(BRITT)
      useSessionStore.getState().addScannedProduct(NUMAR)

      const { products } = useSessionStore.getState()
      expect(products).toHaveLength(2)
      // El previo pierde el resaltado, el último es el único "Nuevo".
      expect(products[0].isNew).toBe(false)
      expect(products[1].isNew).toBe(true)
    })

    it('genera scanIds únicos por línea', () => {
      useSessionStore.getState().addScannedProduct(BRITT)
      useSessionStore.getState().addScannedProduct(BRITT)

      const { products } = useSessionStore.getState()
      expect(products[0].scanId).not.toBe(products[1].scanId)
    })

    it('actualiza el stateName al haber productos', () => {
      expect(useSessionStore.getState().stateName).toBe('empty')
      useSessionStore.getState().addScannedProduct(BRITT)
      expect(useSessionStore.getState().stateName).not.toBe('empty')
    })
  })

  describe('selectPendingPoints', () => {
    it('suma los puntos ofrecidos por productos no validados', () => {
      useSessionStore.getState().addScannedProduct(BRITT) // 15
      useSessionStore.getState().addScannedProduct(NUMAR) // 10

      const pendientes = selectPendingPoints(useSessionStore.getState())
      expect(pendientes).toBe(BRITT.pointsOffered + NUMAR.pointsOffered) // 25
    })

    it('devuelve 0 cuando no hay productos', () => {
      expect(selectPendingPoints(useSessionStore.getState())).toBe(0)
    })
  })

  describe('removeProduct', () => {
    it('elimina la línea por su scanId', () => {
      useSessionStore.getState().addScannedProduct(BRITT)
      useSessionStore.getState().addScannedProduct(NUMAR)

      const { scanId } = useSessionStore.getState().products[0]
      useSessionStore.getState().removeProduct(scanId)

      const { products } = useSessionStore.getState()
      expect(products).toHaveLength(1)
      expect(products.find((p) => p.scanId === scanId)).toBeUndefined()
    })

    it('no hace nada si el scanId no existe', () => {
      useSessionStore.getState().addScannedProduct(BRITT)
      useSessionStore.getState().removeProduct('scan-inexistente')
      expect(useSessionStore.getState().products).toHaveLength(1)
    })
  })

  describe('confirmValidation', () => {
    it('acredita los puntos en pointsStore y marca los productos como validados', () => {
      useSessionStore.getState().addScannedProduct(BRITT)
      useSessionStore.getState().addScannedProduct(NUMAR)

      const saldoInicial = usePointsStore.getState().balance
      const result: ValidationResult = {
        validated: true,
        creditedPoints: 25,
        validatedProducts: [],
      }

      useSessionStore.getState().confirmValidation(result)

      // Crédito aplicado una vez.
      expect(usePointsStore.getState().balance).toBe(saldoInicial + 25)
      // Todos los productos quedan validados.
      expect(useSessionStore.getState().products.every((p) => p.validated)).toBe(true)
      // El estado pasa a 'confirmed' y se guarda la validación.
      expect(useSessionStore.getState().stateName).toBe('confirmed')
      expect(useSessionStore.getState().validation).toEqual(result)
    })

    it('es idempotente: dos llamadas con el mismo result NO duplican el crédito', () => {
      useSessionStore.getState().addScannedProduct(BRITT)

      const saldoInicial = usePointsStore.getState().balance
      const result: ValidationResult = {
        validated: true,
        creditedPoints: 15,
        validatedProducts: [],
      }

      useSessionStore.getState().confirmValidation(result)
      useSessionStore.getState().confirmValidation(result)

      // El crédito se aplica una sola vez pese a la segunda llamada.
      expect(usePointsStore.getState().balance).toBe(saldoInicial + 15)
    })
  })

  describe('reset', () => {
    it('limpia productos, ticket, validación y vuelve al estado empty', () => {
      useSessionStore.getState().addScannedProduct(BRITT)
      useSessionStore.getState().confirmValidation({
        validated: true,
        creditedPoints: 15,
        validatedProducts: [],
      })

      useSessionStore.getState().reset()

      const state = useSessionStore.getState()
      expect(state.products).toHaveLength(0)
      expect(state.qrTicket).toBeNull()
      expect(state.validation).toBeNull()
      expect(state.stateName).toBe('empty')
    })
  })
})
