import type { Product } from '@/domain/models/types'
import { SponsoredProductCard } from '@/components/domain/SponsoredProductCard'
import styles from './SponsoredCarousel.module.css'

export interface SponsoredCarouselProps {
  products: Product[]
}

/** Carrusel con scroll horizontal de productos patrocinados (.sponsored-scroll). */
export function SponsoredCarousel({ products }: SponsoredCarouselProps) {
  return (
    <div className={styles.scroll}>
      {products.map((product) => (
        <SponsoredProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
