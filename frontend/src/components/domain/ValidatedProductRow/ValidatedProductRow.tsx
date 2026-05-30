import { Icon, Pill, productIconName } from '@/components/ui'
import { formatPoints } from '@/utils/format'
import type { ScannedProduct } from '@/domain/models/types'
import styles from './ValidatedProductRow.module.css'

export interface ValidatedProductRowProps {
  product: ScannedProduct
}

/** Fila de producto validado: check verde, ícono, nombre y puntos. */
export function ValidatedProductRow({ product }: ValidatedProductRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.check}>
        <Icon name="check" className={styles.checkIcon} />
      </span>
      <span className={styles.icon}>
        <Icon name={productIconName(product.iconKey)} />
      </span>
      <span className={styles.name}>{product.name}</span>
      <Pill variant="points">{formatPoints(product.pointsOffered)} pts</Pill>
    </div>
  )
}
