/**
 * Hook del escáner de productos.
 *
 * Orquesta el patrón Strategy (cámara / ingreso manual) para capturar un barcode
 * y lo somete a la cadena de validación (Chain of Responsibility) antes de
 * agregarlo a la sesión. Los rechazos se publican en el EventBus (Observer).
 */
import { useCallback, useRef, useState } from 'react'
import type { BarcodeSource, IBarcodeInputStrategy } from '@/domain/models/types'
import { CameraStrategy, ManualEntryStrategy } from '@/domain/strategies'
import { runScanChain } from '@/domain/validation'
import { eventBus } from '@/domain/events/EventBus'
import { useSessionStore } from '@/store/sessionStore'

/** Estado local del escáner. */
interface ScannerState {
  source: BarcodeSource
  scanning: boolean
  lastError: string | null
}

/** Gestiona la captura y validación de escaneos para la UI. */
export function useScanner() {
  const [state, setState] = useState<ScannerState>({
    source: 'camera',
    scanning: false,
    lastError: null,
  })

  // Instancias persistentes de las estrategias (mantienen su estado interno).
  const cameraRef = useRef<IBarcodeInputStrategy>(new CameraStrategy())
  const manualRef = useRef<IBarcodeInputStrategy>(new ManualEntryStrategy())

  /** Cambia la fuente de captura activa (cámara o manual). */
  const setSource = useCallback((source: BarcodeSource) => {
    setState((prev) => ({ ...prev, source }))
  }, [])

  /**
   * Captura y valida un escaneo. La cámara ignora `input`; el manual lo usa.
   * Retorna true si el producto se agregó; false si fue rechazado o falló.
   */
  const scan = useCallback(
    async (input?: string): Promise<boolean> => {
      const strategy = state.source === 'camera' ? cameraRef.current : manualRef.current
      setState((prev) => ({ ...prev, scanning: true, lastError: null }))

      try {
        // 1) Captura del barcode mediante la estrategia activa.
        const barcode = await strategy.capture(input)

        // 2) Validación contra la cadena de responsabilidad.
        const { store, products } = useSessionStore.getState()
        const result = await runScanChain({
          barcode,
          store,
          existingBarcodes: products.map((p) => p.barcode),
        })

        if (!result.ok || !result.product) {
          const reason = result.reason ?? 'Escaneo rechazado'
          setState((prev) => ({ ...prev, scanning: false, lastError: reason }))
          eventBus.publish({ type: 'SCAN_REJECTED', message: reason })
          return false
        }

        // 3) Producto válido: lo agrega a la sesión.
        useSessionStore.getState().addScannedProduct(result.product)
        setState((prev) => ({ ...prev, scanning: false, lastError: null }))
        return true
      } catch (error) {
        // La captura puede fallar (p.ej. EAN-13 manual inválido): se trata como rechazo.
        const reason = error instanceof Error ? error.message : 'Escaneo rechazado'
        setState((prev) => ({ ...prev, scanning: false, lastError: reason }))
        eventBus.publish({ type: 'SCAN_REJECTED', message: reason })
        return false
      }
    },
    [state.source],
  )

  return {
    source: state.source,
    scanning: state.scanning,
    lastError: state.lastError,
    setSource,
    scan,
  }
}
