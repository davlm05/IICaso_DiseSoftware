import { Icon } from '@/components/ui'
import { ProductListItem } from '@/components/domain/ProductListItem'
import type { ScannedProduct } from '@/domain/models/types'
import styles from './ScannedProductsList.module.css'

export interface ScannedProductsListProps {
  products: ScannedProduct[]
  onRemove: (scanId: string) => void
}

/** Estado vacío de la lista (.empty-card del mockup pantalla-1). */
function EmptyScannedState() {
  return (
    <div className={styles.emptyCard}>
      <div className={styles.emptyIconWrap}>
        <Icon name="barcode" />
      </div>
      <div className={styles.emptyTitle}>Aun no has escaneado nada</div>
      <div className={styles.emptySub}>
        Escanea productos patrocinados para ir acumulando puntos pendientes
      </div>
    </div>
  )
}

/**
 * Lista de productos escaneados (.scanned-card).
 * Si está vacía muestra el estado vacío; si no, mapea cada producto a una fila.
 */
export function ScannedProductsList({ products, onRemove }: ScannedProductsListProps) {
  if (products.length === 0) {
    return <EmptyScannedState />
  }

  return (
    <div className={styles.card}>
      {products.map((product, index) => (
        <ProductListItem
          key={product.scanId}
          product={product}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
