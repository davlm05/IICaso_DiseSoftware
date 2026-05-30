/**
 * Tests unitarios de pointsStore.
 *
 * Verifica el saldo de puntos del usuario: estado inicial = INITIAL_POINTS,
 * acreditación (credit), descuento (debit) y reinicio (reset). El store es un
 * singleton de módulo, así que se resetea antes de cada test.
 */
import { usePointsStore } from '@/store/pointsStore'
import { INITIAL_POINTS } from '@/services/mock/db'

describe('pointsStore', () => {
  // Resetea el singleton a su estado inicial antes de cada test.
  beforeEach(() => {
    usePointsStore.getState().reset()
  })

  it('inicia con el saldo y meta de INITIAL_POINTS', () => {
    const state = usePointsStore.getState()
    expect(state.balance).toBe(INITIAL_POINTS.balance)
    expect(state.nextRewardThreshold).toBe(INITIAL_POINTS.nextRewardThreshold)
  })

  it('credit suma puntos al saldo', () => {
    usePointsStore.getState().credit(30)
    expect(usePointsStore.getState().balance).toBe(INITIAL_POINTS.balance + 30)
  })

  it('credit acumula a través de varias llamadas', () => {
    usePointsStore.getState().credit(10)
    usePointsStore.getState().credit(5)
    expect(usePointsStore.getState().balance).toBe(INITIAL_POINTS.balance + 15)
  })

  it('debit descuenta puntos del saldo', () => {
    usePointsStore.getState().debit(20)
    expect(usePointsStore.getState().balance).toBe(INITIAL_POINTS.balance - 20)
  })

  it('reset restablece el saldo y la meta a INITIAL_POINTS', () => {
    usePointsStore.getState().credit(100)
    usePointsStore.getState().debit(40)
    usePointsStore.getState().reset()

    const state = usePointsStore.getState()
    expect(state.balance).toBe(INITIAL_POINTS.balance)
    expect(state.nextRewardThreshold).toBe(INITIAL_POINTS.nextRewardThreshold)
  })
})
