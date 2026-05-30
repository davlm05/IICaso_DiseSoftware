import { Card } from '@/components/ui'
import { formatColones } from '@/utils/format'
import styles from './TicketTotal.module.css'

export interface TicketTotalProps {
  total: number
}

/** Total comprado en productos patrocinados (en colones). */
export function TicketTotal({ total }: TicketTotalProps) {
  return (
    <Card className={styles.card} padding="12px 16px">
      <span className={styles.label}>Total comprado en patrocinados</span>
      <span className={styles.amount}>{formatColones(total)}</span>
    </Card>
  )
}
