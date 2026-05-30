import type { Product } from '@/domain/models/types'
import { Icon, productIconName } from '@/components/ui'
import { formatColones } from '@/utils/format'
import styles from './SponsoredProductCard.module.css'

export interface SponsoredProductCardProps {
  product: Product
}

/** Tarjeta de producto patrocinado del carrusel (.sponsored-card del mockup pantalla-1). */
export function SponsoredProductCard({ product }: SponsoredProductCardProps) {
  return (
    <article className={styles.card}>
      {/* Puntos ofrecidos, esquina superior derecha */}
      <span className={styles.ptsTag}>+{product.pointsOffered} pts</span>

      {/* Ícono del producto según su clave semántica */}
      <div className={styles.iconWrap}>
        <Icon name={productIconName(product.iconKey)} />
      </div>

      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.brand}>{product.brand}</p>
      <p className={styles.price}>{formatColones(product.price)}</p>
    </article>
  )
}
