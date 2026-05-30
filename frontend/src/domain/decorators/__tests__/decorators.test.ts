import { getProductBadges, getRewardLockState } from '@/domain/decorators'
import type { ProductBadge, Reward, ScannedProduct } from '@/domain/models/types'

/**
 * Tests del patrón Decorator (GoF).
 *
 * getProductBadges compone sponsored -> new -> validated según las flags del
 * producto. getRewardLockState deriva locked y missing a partir del costo de la
 * recompensa y los puntos actuales del usuario.
 */

/** Producto escaneado base con flags controlables por test. */
function createScannedProduct(overrides: Partial<ScannedProduct> = {}): ScannedProduct {
  return {
    id: 'prod-britt',
    barcode: '7441001823456',
    name: 'Cafe Britt 500g',
    brand: 'Cafe Britt',
    price: 3250,
    iconKey: 'coffee',
    sponsored: false,
    pointsOffered: 15,
    scanId: 'scan-001',
    scannedAt: 1_700_000_000_000,
    isNew: false,
    validated: false,
    ...overrides,
  }
}

/** Recompensa base para las pruebas de bloqueo. */
function createReward(cost: number): Reward {
  return {
    id: 'rw-15',
    type: 'discount',
    name: '-15% en tu compra',
    description: 'Descuento directo en tu próxima compra',
    cost,
    expiresInDays: null,
    iconKey: 'discount',
    gradient: 'discount',
    premium: false,
    featured: false,
  }
}

describe('getProductBadges', () => {
  it('producto sin flags no genera badges', () => {
    const badges = getProductBadges(createScannedProduct())

    expect(badges).toEqual([])
  })

  it('agrega "sponsored" cuando el producto es patrocinado', () => {
    const badges = getProductBadges(createScannedProduct({ sponsored: true }))

    expect(badges).toContain('sponsored')
  })

  it('agrega "new" cuando el producto es el recién escaneado', () => {
    const badges = getProductBadges(createScannedProduct({ isNew: true }))

    expect(badges).toContain('new')
  })

  it('agrega "validated" cuando el producto fue validado en caja', () => {
    const badges = getProductBadges(createScannedProduct({ validated: true }))

    expect(badges).toContain('validated')
  })

  it('compone los tres badges en orden sponsored -> new -> validated', () => {
    const badges = getProductBadges(
      createScannedProduct({ sponsored: true, isNew: true, validated: true }),
    )

    const expected: ProductBadge[] = ['sponsored', 'new', 'validated']
    expect(badges).toEqual(expected)
  })

  it('respeta el orden parcial cuando solo algunas flags están activas', () => {
    const badges = getProductBadges(
      createScannedProduct({ sponsored: true, isNew: false, validated: true }),
    )

    expect(badges).toEqual(['sponsored', 'validated'])
  })
})

describe('getRewardLockState', () => {
  it('locked=true y missing>0 cuando el costo supera los puntos actuales', () => {
    const { locked, missing } = getRewardLockState(createReward(100), 60)

    expect(locked).toBe(true)
    expect(missing).toBe(40)
  })

  it('locked=false y missing=0 cuando los puntos igualan el costo', () => {
    const { locked, missing } = getRewardLockState(createReward(100), 100)

    expect(locked).toBe(false)
    expect(missing).toBe(0)
  })

  it('locked=false y missing=0 cuando los puntos exceden el costo', () => {
    const { locked, missing } = getRewardLockState(createReward(100), 150)

    expect(locked).toBe(false)
    expect(missing).toBe(0)
  })

  it('missing nunca es negativo (clamp en 0)', () => {
    const { missing } = getRewardLockState(createReward(50), 500)

    expect(missing).toBe(0)
  })
})
