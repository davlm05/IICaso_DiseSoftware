import { runScanChain, buildScanChain } from '@/domain/validation'
import type { ScanContext, Store } from '@/domain/models/types'
import { MOCK_STORE, PRODUCT_CATALOG } from '@/services/mock/db'

/**
 * Tests del patrón Chain of Responsibility (GoF) de validación de escaneo.
 *
 * Orden de la cadena: Location -> Format -> Sponsored -> Duplicate.
 * Se prueba que cada eslabón rechaza con el código esperado y que un barcode
 * patrocinado real del catálogo (Cafe Britt) atraviesa toda la cadena con OK.
 */

/** Barcode patrocinado real del catálogo mock (Cafe Britt 500g). */
const SPONSORED_BARCODE = '7441001823456'

/** Tienda afiliada de referencia. */
const STORE: Store = MOCK_STORE

/** Construye un ScanContext con valores por defecto sobreescribibles. */
function createContext(overrides: Partial<ScanContext> = {}): ScanContext {
  return {
    barcode: SPONSORED_BARCODE,
    store: STORE,
    existingBarcodes: [],
    ...overrides,
  }
}

describe('runScanChain — rechazos por eslabón', () => {
  it('rechaza LOCATION cuando store es null', async () => {
    const result = await runScanChain(createContext({ store: null }))

    expect(result.ok).toBe(false)
    expect(result.code).toBe('LOCATION')
    expect(result.product).toBeUndefined()
  })

  it('rechaza FORMAT cuando el barcode no tiene 13 dígitos', async () => {
    const result = await runScanChain(createContext({ barcode: '12345' }))

    expect(result.ok).toBe(false)
    expect(result.code).toBe('FORMAT')
  })

  it('rechaza FORMAT cuando el barcode tiene 13 caracteres pero no numéricos', async () => {
    const result = await runScanChain(createContext({ barcode: '74410018234AB' }))

    expect(result.ok).toBe(false)
    expect(result.code).toBe('FORMAT')
  })

  it('rechaza NOT_SPONSORED cuando el barcode no está en el catálogo', async () => {
    // 13 dígitos válidos en formato pero ausente del catálogo.
    const result = await runScanChain(createContext({ barcode: '9999999999999' }))

    expect(result.ok).toBe(false)
    expect(result.code).toBe('NOT_SPONSORED')
  })

  it('rechaza DUPLICATE cuando el barcode ya está en existingBarcodes', async () => {
    const result = await runScanChain(
      createContext({ existingBarcodes: [SPONSORED_BARCODE] }),
    )

    expect(result.ok).toBe(false)
    expect(result.code).toBe('DUPLICATE')
  })
})

describe('runScanChain — caso OK', () => {
  it('retorna ok:true y el product para un barcode patrocinado real del catálogo', async () => {
    const result = await runScanChain(createContext())

    expect(result.ok).toBe(true)
    expect(result.code).toBeUndefined()
    expect(result.product).toBeDefined()
    expect(result.product).toEqual(PRODUCT_CATALOG[SPONSORED_BARCODE])
    expect(result.product?.barcode).toBe(SPONSORED_BARCODE)
    expect(result.product?.sponsored).toBe(true)
  })
})

describe('buildScanChain', () => {
  it('arma una cadena cuya cabeza valida primero la ubicación (LOCATION)', async () => {
    const chain = buildScanChain()

    // store null y barcode inválido: debe priorizar el primer eslabón (LOCATION).
    const result = await chain.handle(
      createContext({ store: null, barcode: 'abc' }),
    )

    expect(result.ok).toBe(false)
    expect(result.code).toBe('LOCATION')
  })

  it('propaga el product resuelto a través de toda la cadena en caso OK', async () => {
    const chain = buildScanChain()

    const result = await chain.handle(createContext())

    expect(result.ok).toBe(true)
    expect(result.product?.id).toBe(PRODUCT_CATALOG[SPONSORED_BARCODE].id)
  })
})
