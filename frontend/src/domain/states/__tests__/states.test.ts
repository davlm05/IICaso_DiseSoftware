import { getSessionState, resolveStateName } from '@/domain/states'
import type { SessionStateName } from '@/domain/models/types'

/**
 * Tests del patrón State (GoF) de la sesión de compra.
 *
 * Verifica que getSessionState devuelve la vista correcta con sus flags de
 * capacidad por nombre, y que resolveStateName aplica la prioridad documentada:
 * confirmed > validating > withProducts (productCount>0) > empty.
 */

describe('getSessionState', () => {
  it('empty: solo permite escanear', () => {
    const state = getSessionState('empty')

    expect(state.name).toBe('empty')
    expect(state.canScan).toBe(true)
    expect(state.canGenerateQr).toBe(false)
    expect(state.canConfirm).toBe(false)
  })

  it('scanning: solo permite escanear', () => {
    const state = getSessionState('scanning')

    expect(state.name).toBe('scanning')
    expect(state.canScan).toBe(true)
    expect(state.canGenerateQr).toBe(false)
    expect(state.canConfirm).toBe(false)
  })

  it('withProducts: permite escanear y generar QR', () => {
    const state = getSessionState('withProducts')

    expect(state.name).toBe('withProducts')
    expect(state.canScan).toBe(true)
    expect(state.canGenerateQr).toBe(true)
    expect(state.canConfirm).toBe(false)
  })

  it('validating: solo permite confirmar', () => {
    const state = getSessionState('validating')

    expect(state.name).toBe('validating')
    expect(state.canScan).toBe(false)
    expect(state.canGenerateQr).toBe(false)
    expect(state.canConfirm).toBe(true)
  })

  it('confirmed: solo permite escanear (nueva compra)', () => {
    const state = getSessionState('confirmed')

    expect(state.name).toBe('confirmed')
    expect(state.canScan).toBe(true)
    expect(state.canGenerateQr).toBe(false)
    expect(state.canConfirm).toBe(false)
  })

  it('devuelve la misma instancia singleton por nombre', () => {
    const names: SessionStateName[] = ['empty', 'scanning', 'withProducts', 'validating', 'confirmed']
    for (const name of names) {
      expect(getSessionState(name)).toBe(getSessionState(name))
    }
  })
})

describe('resolveStateName', () => {
  it('prioriza confirmed sobre todo lo demás', () => {
    const name = resolveStateName({
      productCount: 3,
      validating: true,
      confirmed: true,
    })

    expect(name).toBe('confirmed')
  })

  it('prioriza validating sobre withProducts cuando no está confirmed', () => {
    const name = resolveStateName({
      productCount: 3,
      validating: true,
      confirmed: false,
    })

    expect(name).toBe('validating')
  })

  it('withProducts cuando hay productos y no está validating/confirmed', () => {
    const name = resolveStateName({
      productCount: 1,
      validating: false,
      confirmed: false,
    })

    expect(name).toBe('withProducts')
  })

  it('empty cuando no hay productos ni otros flags', () => {
    const name = resolveStateName({
      productCount: 0,
      validating: false,
      confirmed: false,
    })

    expect(name).toBe('empty')
  })

  it('empty cuando los flags opcionales se omiten y productCount es 0', () => {
    const name = resolveStateName({ productCount: 0 })

    expect(name).toBe('empty')
  })

  it('withProducts cuando productCount > 0 y los flags se omiten', () => {
    const name = resolveStateName({ productCount: 5 })

    expect(name).toBe('withProducts')
  })
})
