/**
 * Hook de polling del QR de validación.
 *
 * Mientras exista un ticket, cuenta regresivamente su vigencia (interval de 1s) y
 * espera la confirmación del POS (QrValidationService.awaitValidation) vía
 * AbortController. Expone validación inmediata (demo) y cancelación.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ValidationResult } from '@/domain/models/types'
import { QrValidationService } from '@/services'
import { useSessionStore } from '@/store/sessionStore'

/** Estados posibles del proceso de validación por QR. */
type QrStatus = 'idle' | 'waiting' | 'validated' | 'expired' | 'cancelled'

/** Gestiona el ciclo de vida de la validación por QR para la UI. */
export function useQrPolling() {
  const qrTicket = useSessionStore((s) => s.qrTicket)

  const [status, setStatus] = useState<QrStatus>('idle')
  const [remainingMs, setRemainingMs] = useState(0)

  // Referencias mutables para coordinar interval y aborto desde callbacks.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  /** Detiene el contador regresivo activo. */
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    // Sin ticket: estado inactivo y sin temporizadores.
    if (!qrTicket) {
      setStatus('idle')
      setRemainingMs(0)
      return
    }

    setStatus('waiting')
    setRemainingMs(Math.max(0, qrTicket.expiresAt - Date.now()))

    // Contador regresivo: expira el ticket cuando se agota su vigencia.
    intervalRef.current = setInterval(() => {
      const left = qrTicket.expiresAt - Date.now()
      if (left <= 0) {
        setRemainingMs(0)
        setStatus('expired')
        clearTimer()
        controllerRef.current?.abort()
        return
      }
      setRemainingMs(left)
    }, 1_000)

    // Espera la confirmación automática del POS (cancelable por signal).
    // Lee los productos frescos del store (no como dependencia) para que el
    // efecto NO se re-suscriba al marcarse validados y evite acreditar en bucle.
    const controller = new AbortController()
    controllerRef.current = controller
    const products = useSessionStore.getState().products
    QrValidationService.awaitValidation(qrTicket, products, controller.signal)
      .then((result) => {
        useSessionStore.getState().confirmValidation(result)
        setStatus('validated')
        clearTimer()
      })
      .catch(() => {
        // Aborto (expiración o cancelación): el estado ya lo fijó quien abortó.
      })

    // Cleanup: detiene el contador y aborta la espera pendiente.
    return () => {
      clearTimer()
      controller.abort()
    }
  }, [qrTicket, clearTimer])

  /** Validación inmediata (demo): acredita y confirma sin esperar al POS. */
  const validate = useCallback(() => {
    const current = useSessionStore.getState().products
    const result: ValidationResult = {
      validated: true,
      creditedPoints: current.reduce((sum, p) => sum + p.pointsOffered, 0),
      validatedProducts: current.map((p) => ({ ...p, validated: true })),
    }
    controllerRef.current?.abort()
    clearTimer()
    useSessionStore.getState().confirmValidation(result)
    setStatus('validated')
  }, [clearTimer])

  /** Cancela la validación y descarta el ticket. */
  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    clearTimer()
    useSessionStore.getState().cancelValidation()
    setStatus('cancelled')
  }, [clearTimer])

  return { status, remainingMs, validate, cancel }
}
