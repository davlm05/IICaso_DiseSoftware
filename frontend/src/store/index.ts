/**
 * Barrel de la capa de ESTADO (Zustand).
 *
 * Reexporta los stores singleton, sus tipos públicos y los selectores puros,
 * para que la UI importe todo desde '@/store'.
 */
export { useSessionStore } from './sessionStore'
export type { SessionState } from './sessionStore'
export { usePointsStore } from './pointsStore'
export { useRewardsStore } from './rewardsStore'
export { useAuthStore } from './authStore'

export {
  selectPendingPoints,
  selectProductCount,
  selectTotalSpent,
  selectState,
  selectCanGenerateQr,
} from './selectors'
