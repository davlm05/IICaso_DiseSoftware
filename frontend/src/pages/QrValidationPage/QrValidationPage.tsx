import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell, TopBar } from '@/components/layout'
import { Button } from '@/components/ui'
import { QrPanel } from '@/components/domain/QrPanel'
import { useShoppingSession, useQrPolling } from '@/hooks'
import { PATHS } from '@/router/paths'
import styles from './QrValidationPage.module.css'

/**
 * QrValidationPage — Mockup 5 (pantalla verde con QR).
 *
 * Muestra el código QR generado para que la cajera lo escanee y valide la compra
 * de productos patrocinados. Hace polling del estado de validación: al validarse,
 * navega a la confirmación. Si no hay ticket, el guard redirige al home.
 */
export default function QrValidationPage() {
  const navigate = useNavigate()
  const { qrTicket, products, pendingPoints } = useShoppingSession()
  const { status, validate, cancel } = useQrPolling()

  // Guard: sin ticket no hay nada que mostrar -> volver al home.
  useEffect(() => {
    if (!qrTicket) {
      navigate(PATHS.home, { replace: true })
    }
  }, [qrTicket, navigate])

  // Al validarse la compra, avanzar a la pantalla de confirmación.
  useEffect(() => {
    if (status === 'validated') {
      navigate(PATHS.confirmation, { replace: true })
    }
  }, [status, navigate])

  /** Cancela la validación en curso y regresa al home. */
  const handleCancel = () => {
    cancel()
    navigate(PATHS.home)
  }

  return (
    <PhoneShell
      background="primary"
      contentPadding={false}
      header={
        <TopBar
          mode="back"
          title="Validacion de compra"
          onPrimary
          onBack={handleCancel}
        />
      }
    >
      <div className={styles.content}>
        <header className={styles.headerMsg}>
          <h2 className={styles.headerTitle}>Muestrale este codigo a la cajera</h2>
          <p className={styles.headerSub}>
            La cajera lo escaneara para validar que compraste los productos patrocinados
          </p>
        </header>

        {qrTicket && (
          <QrPanel
            ticket={qrTicket}
            productCount={products.length}
            pendingPoints={pendingPoints}
          />
        )}

        {status === 'waiting' && (
          <div className={styles.waiting}>
            <span className={styles.dotPulse} aria-hidden="true" />
            Esperando validacion de la cajera...
          </div>
        )}

        <div className={styles.actions}>
          <div className={styles.demoHint}>
            <Button variant="qr" fullWidth onClick={validate}>
              Simular validacion de cajera
            </Button>
          </div>
          <Button variant="qr" fullWidth onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </PhoneShell>
  )
}
