import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell, TopBar } from '@/components/layout'
import { Button, SectionTitle } from '@/components/ui'
import { ConfirmationHero } from '@/components/domain/ConfirmationHero'
import { ConfirmationResultCard } from '@/components/domain/ConfirmationResultCard'
import { ValidatedProductRow } from '@/components/domain/ValidatedProductRow'
import { TicketTotal } from '@/components/domain/TicketTotal'
import { useShoppingSession } from '@/hooks'
import { usePointsStore } from '@/store/pointsStore'
import { PATHS } from '@/router/paths'
import styles from './ConfirmationPage.module.css'

/**
 * ConfirmationPage — pantalla 6 (confirmación de compra validada).
 *
 * Muestra el hero de éxito, los puntos acreditados (ya sumados al saldo), la
 * lista de productos validados en caja y el total comprado en patrocinados.
 * Guard: si no hay validación en la sesión, redirige a Home (replace).
 */
export default function ConfirmationPage() {
  const navigate = useNavigate()
  const { products, validation, reset } = useShoppingSession()
  const balance = usePointsStore((s) => s.balance)
  const nextRewardThreshold = usePointsStore((s) => s.nextRewardThreshold)

  // Sin validación no hay nada que confirmar: volver a Home sin dejar historial.
  useEffect(() => {
    if (!validation) {
      navigate(PATHS.home, { replace: true })
    }
  }, [validation, navigate])

  if (!validation) {
    return null
  }

  const validated = validation.validatedProducts ?? products
  const creditedPoints = validation.creditedPoints ?? 0
  const total = validated.reduce((sum, p) => sum + p.price, 0)

  return (
    <PhoneShell
      background="app"
      contentPadding={false}
      header={<TopBar mode="back" title="Compra validada" onBack={() => navigate(PATHS.home)} />}
    >
      <div className={styles.heroWrap}>
        <ConfirmationHero
          title="Puntos acreditados"
          subtitle="Tu compra fue verificada en caja"
        />
      </div>

      <div className={styles.body}>
        <ConfirmationResultCard
          creditedPoints={creditedPoints}
          totalBalance={balance}
          threshold={nextRewardThreshold}
        />

        <SectionTitle>Productos validados</SectionTitle>

        <div className={styles.list}>
          {validated.map((p) => (
            <ValidatedProductRow key={p.scanId} product={p} />
          ))}
        </div>

        <TicketTotal total={total} />

        <Button
          variant="primary"
          fullWidth
          icon="house"
          onClick={() => {
            reset()
            navigate(PATHS.home)
          }}
        >
          Volver al inicio
        </Button>

        <Button
          variant="secondary"
          fullWidth
          icon="gift"
          onClick={() => navigate(PATHS.rewards)}
        >
          Ver mis recompensas
        </Button>
      </div>
    </PhoneShell>
  )
}
