/**
 * pointsStore — saldo de puntos del usuario.
 *
 * Estado simple de puntos acreditados (balance) y meta del próximo canje.
 * Lo mutan: la validación de sesión (credit) y el canje de recompensas
 * (debit/credit en undo). Singleton de módulo vía Zustand.
 */
import { create } from 'zustand'
import { INITIAL_POINTS } from '@/services/mock/db'

interface PointsStore {
  balance: number
  nextRewardThreshold: number
  credit(points: number): void
  debit(points: number): void
  reset(): void
}

export const usePointsStore = create<PointsStore>()((set) => ({
  balance: INITIAL_POINTS.balance,
  nextRewardThreshold: INITIAL_POINTS.nextRewardThreshold,

  // Acredita puntos al saldo (validación POS, undo de canje).
  credit: (points) => set((s) => ({ balance: s.balance + points })),

  // Descuenta puntos del saldo (canje de recompensa).
  debit: (points) => set((s) => ({ balance: s.balance - points })),

  // Reinicia el saldo a los valores iniciales.
  reset: () =>
    set({
      balance: INITIAL_POINTS.balance,
      nextRewardThreshold: INITIAL_POINTS.nextRewardThreshold,
    }),
}))
