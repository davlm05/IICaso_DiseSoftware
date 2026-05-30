import { Icon, productIconName } from '@/components/ui'
import { getProductBadges } from '@/domain/decorators'
import type { ScannedProduct } from '@/domain/models/types'
import { formatColones, formatPoints } from '@/utils/format'
import styles from './ProductListItem.module.css'

export interface ProductListItemProps {
  product: ScannedProduct
  index: number
  onRemove: (scanId: string) => void
}

/**
 * Fila de un producto escaneado (.scanned-item del mockup pantalla-4).
 * Muestra ícono, nombre, marca + precio, tag de puntos pendientes y badge "Nuevo".
 */
export function ProductListItem({ product, index, onRemove }: ProductListItemProps) {
  // Los decoradores deciden qué distintivos aplican (sponsored/new/validated).
  const badges = getProductBadges(product)
  const showNew = badges.includes('new')

  // La fila recién escaneada se resalta con fondo verde claro (.scanned-item.new).
  const rowClasses = showNew ? `${styles.item} ${styles.itemNew}` : styles.item

  return (
    <div className={rowClasses} data-index={index}>
      <div className={styles.iconWrap}>
        <Icon name={productIconName(product.iconKey)} />
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{product.name}</span>
          {showNew ? <span className={styles.newTag}>Nuevo</span> : null}
        </div>
        <div className={styles.meta}>
          {product.brand} · {formatColones(product.price)}
        </div>
      </div>

      <span className={styles.pts}>{formatPoints(product.pointsOffered)} pts</span>

      <button
        type="button"
        className={styles.remove}
        aria-label={`Eliminar ${product.name}`}
        onClick={() => onRemove(product.scanId)}
      >
        <Icon name="xmark" />
      </button>
    </div>
  )
}
