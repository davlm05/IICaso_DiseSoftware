/**
 * Hook de la sesión de compra.
 *
 * Observer fino: selecciona del `useSessionStore` cada campo por separado para
 * que la UI solo re-renderice ante el cambio que la afecta. Deriva la vista del
 * estado (State pattern) y los puntos pendientes (selector puro), y reexpone las
 * acciones de alto nivel del store.
 */
import { useSessionStore } from '@/store/sessionStore'
import { selectPendingPoints } from '@/store/selectors'
import { getSessionState } from '@/domain/states'

/** Conecta la UI con la sesión de compra del store. */
export function useShoppingSession() {
  // Selectores individuales (suscripciones finas e independientes).
  const store = useSessionStore((s) => s.store)
  const products = useSessionStore((s) => s.products)
  const stateName = useSessionStore((s) => s.stateName)
  const qrTicket = useSessionStore((s) => s.qrTicket)
  const validation = useSessionStore((s) => s.validation)

  // Puntos pendientes: selector puro como suscripción fina e independiente.
  const pendingPoints = useSessionStore(selectPendingPoints)

  // Acciones de alto nivel (referencias estables del store).
  const setStore = useSessionStore((s) => s.setStore)
  const addScannedProduct = useSessionStore((s) => s.addScannedProduct)
  const removeProduct = useSessionStore((s) => s.removeProduct)
  const generateQr = useSessionStore((s) => s.generateQr)
  const confirmValidation = useSessionStore((s) => s.confirmValidation)
  const cancelValidation = useSessionStore((s) => s.cancelValidation)
  const reset = useSessionStore((s) => s.reset)
  const undoLast = useSessionStore((s) => s.undoLast)

  // Derivado: vista (singleton) del estado actual.
  const state = getSessionState(stateName)

  return {
    // estado
    store,
    products,
    stateName,
    state,
    qrTicket,
    validation,
    pendingPoints,
    // acciones
    setStore,
    addScannedProduct,
    removeProduct,
    generateQr,
    confirmValidation,
    cancelValidation,
    reset,
    undoLast,
  }
}
