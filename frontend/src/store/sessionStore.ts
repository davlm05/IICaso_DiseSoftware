/**
 * sessionStore — núcleo de la sesión de compra (Singleton + State + Command).
 *
 * Materializa el patrón State (getSessionState/resolveStateName) sobre un
 * estado plano de Zustand y delega cada mutación reversible en el patrón
 * Command (vía commandBus). Los mutadores crudos (insertProduct, deleteProduct,
 * etc.) componen `SessionMutations`, que los Commands invocan sin acoplarse al
 * store. `pendingPoints` NO se almacena: se deriva por selector.
 */
import { create } from 'zustand'
import type {
  Product,
  QrTicket,
  ScannedProduct,
  SessionMutations,
  SessionStateName,
  Store,
  ValidationResult,
} from '@/domain/models/types'
import { resolveStateName } from '@/domain/states'
import {
  AddProductCommand,
  GenerateQRCommand,
  RemoveProductCommand,
  commandBus,
} from '@/domain/commands'
import { eventBus } from '@/domain/events/EventBus'
import { QrValidationService } from '@/services'
import { usePointsStore } from './pointsStore'

/** Identificador estable de la sesión de compra actual (mock). */
const SESSION_ID = 'session-001'

/** Contador monótono para construir scanIds únicos y estables. */
let scanCounter = 0

interface SessionStore {
  store: Store | null
  products: ScannedProduct[]
  stateName: SessionStateName
  qrTicket: QrTicket | null
  validation: ValidationResult | null

  // SessionMutations (mutadores crudos que usan los Commands):
  insertProduct(product: ScannedProduct): void
  deleteProduct(scanId: string): void
  restoreProduct(product: ScannedProduct, index: number): void
  setQrTicket(ticket: QrTicket | null): void
  applyValidation(result: ValidationResult): void

  // Acciones de alto nivel:
  setStore(store: Store): void
  addScannedProduct(product: Product): void
  removeProduct(scanId: string): void
  generateQr(): Promise<QrTicket>
  confirmValidation(result: ValidationResult): void
  cancelValidation(): void
  reset(): void
  undoLast(): boolean
}

/** Estado expuesto del store (lo consumen los selectores puros). */
export type SessionState = SessionStore

export const useSessionStore = create<SessionStore>()((set, get) => {
  // SessionMutations: referencia a los mutadores crudos del propio store.
  const sessionMutations: SessionMutations = {
    insertProduct: (product) => get().insertProduct(product),
    deleteProduct: (scanId) => get().deleteProduct(scanId),
    restoreProduct: (product, index) => get().restoreProduct(product, index),
    setQrTicket: (ticket) => get().setQrTicket(ticket),
    applyValidation: (result) => get().applyValidation(result),
  }

  // Suma de puntos pendientes (productos no validados) en el estado actual.
  const pendingPoints = (): number =>
    get()
      .products.filter((p) => !p.validated)
      .reduce((sum, p) => sum + p.pointsOffered, 0)

  return {
    store: null,
    products: [],
    stateName: 'empty',
    qrTicket: null,
    validation: null,

    /* ---- Mutadores crudos (invocados por los Commands) -------------- */

    // Inserta la línea escaneada al final de la lista.
    insertProduct: (product) =>
      set((s) => ({ products: [...s.products, product] })),

    // Elimina la línea escaneada por su scanId.
    deleteProduct: (scanId) =>
      set((s) => ({ products: s.products.filter((p) => p.scanId !== scanId) })),

    // Restaura una línea en su posición original (undo de eliminación).
    restoreProduct: (product, index) =>
      set((s) => {
        const next = [...s.products]
        next.splice(index, 0, product)
        return { products: next }
      }),

    // Fija o retira el ticket QR.
    setQrTicket: (ticket) => set({ qrTicket: ticket }),

    // Guarda el resultado de validación.
    applyValidation: (result) => set({ validation: result }),

    /* ---- Acciones de alto nivel ------------------------------------- */

    // Establece la tienda actual (resuelta por ubicación).
    setStore: (store) => set({ store }),

    // Escanea un producto: lo envuelve en ScannedProduct y despacha el Command.
    addScannedProduct: (product) => {
      const timestamp = Date.now()
      scanCounter += 1
      const scanned: ScannedProduct = {
        ...product,
        scanId: 'scan-' + timestamp + '-' + scanCounter,
        scannedAt: timestamp,
        isNew: true,
        validated: false,
      }

      // El nuevo es el único "Nuevo": los previos pierden el resaltado.
      set((s) => ({
        products: s.products.map((p) => ({ ...p, isNew: false })),
      }))

      commandBus.dispatch(new AddProductCommand(scanned, sessionMutations))

      eventBus.publish<{ product: ScannedProduct }>({
        type: 'PRODUCT_SCANNED',
        payload: { product: scanned },
        message: scanned.name + ' agregado · +' + scanned.pointsOffered + ' pts pendientes',
      })

      set({ stateName: resolveStateName({ productCount: get().products.length }) })
    },

    // Elimina un producto por scanId, recordando su posición para el undo.
    removeProduct: (scanId) => {
      const products = get().products
      const index = products.findIndex((p) => p.scanId === scanId)
      if (index === -1) return
      const product = products[index]

      commandBus.dispatch(new RemoveProductCommand(product, index, sessionMutations))

      eventBus.publish<{ product: ScannedProduct }>({
        type: 'PRODUCT_REMOVED',
        payload: { product },
        message: product.name + ' eliminado',
      })

      set({ stateName: resolveStateName({ productCount: get().products.length }) })
    },

    // Genera el ticket QR de validación y pasa al estado 'validating'.
    generateQr: async () => {
      const ticket = await QrValidationService.generateQr(
        SESSION_ID,
        get().products.length,
        pendingPoints(),
      )

      commandBus.dispatch(new GenerateQRCommand(ticket, sessionMutations))
      set({ stateName: 'validating' })

      eventBus.publish<{ ticket: QrTicket }>({
        type: 'QR_GENERATED',
        payload: { ticket },
        message: 'QR generado · ' + ticket.code,
      })

      return ticket
    },

    // Confirma la validación POS: marca productos validados y acredita puntos.
    // Idempotente: si ya hay validación aplicada, no vuelve a acreditar (evita
    // doble crédito si coinciden la validación automática del POS y la manual).
    confirmValidation: (result) => {
      if (get().validation) return

      get().applyValidation(result)
      set((s) => ({
        products: s.products.map((p) => ({ ...p, validated: true })),
        stateName: 'confirmed',
      }))

      eventBus.publish<{ result: ValidationResult }>({
        type: 'SESSION_VALIDATED',
        payload: { result },
        message: 'Compra validada · +' + result.creditedPoints + ' pts',
      })

      usePointsStore.getState().credit(result.creditedPoints)
    },

    // Cancela la validación: retira el QR y regresa al estado derivado.
    cancelValidation: () => {
      get().setQrTicket(null)
      set({ stateName: resolveStateName({ productCount: get().products.length }) })
    },

    // Reinicia la sesión por completo.
    reset: () => {
      commandBus.clear()
      set({ products: [], qrTicket: null, validation: null, stateName: 'empty' })
    },

    // Deshace la última operación reversible (Command undo). false si no hay.
    undoLast: () => commandBus.undo(),
  }
})
