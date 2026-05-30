/**
 * Hook de notificaciones (Toast).
 *
 * Observer de la UI: se suscribe a los eventos de dominio relevantes y los
 * traduce en un `ToastMessage` con auto-ocultado. Mantiene un único toast visible
 * a la vez; el id es incremental (sin aleatoriedad) para mantener determinismo.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToastMessage, ToastTone } from '@/domain/models/types'
import { eventBus } from '@/domain/events/EventBus'

/** Tiempo visible del toast antes de ocultarse (ms). */
const AUTO_HIDE_MS = 2_500

/** Suscribe la UI a los eventos que generan notificaciones. */
export function useToast() {
  const [current, setCurrent] = useState<ToastMessage | null>(null)

  // Contador incremental para ids deterministas y temporizador de auto-ocultado.
  const counterRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Programa un toast nuevo y reinicia el temporizador de auto-ocultado. */
  const show = useCallback((tone: ToastTone, text: string) => {
    counterRef.current += 1
    const id = 'toast-' + counterRef.current
    setCurrent({ id, text, tone })

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      setCurrent(null)
      timerRef.current = null
    }, AUTO_HIDE_MS)
  }, [])

  /** Oculta el toast actual de inmediato. */
  const dismiss = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setCurrent(null)
  }, [])

  useEffect(() => {
    // Mapea cada evento a un tono y texto de toast.
    const offScanned = eventBus.subscribe('PRODUCT_SCANNED', (event) => {
      show('success', event.message ?? 'Producto agregado')
    })
    const offRejected = eventBus.subscribe('SCAN_REJECTED', (event) => {
      show('error', event.message ?? 'Escaneo rechazado')
    })
    const offRedeemed = eventBus.subscribe('COUPON_REDEEMED', (event) => {
      show('success', event.message ?? 'Cupón canjeado')
    })

    return () => {
      offScanned()
      offRejected()
      offRedeemed()
      // Limpia el temporizador pendiente al desmontar.
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [show])

  return { toast: current, dismiss }
}
