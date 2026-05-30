import type { CSSProperties } from 'react'
import type { IconKey } from '@/domain/models/types'

/** Props del primitivo de ícono (Font Awesome solid). */
export interface IconProps {
  name: string
  className?: string
  style?: CSSProperties
}

/** Renderiza un ícono Font Awesome solid a partir de su nombre (sin prefijo "fa-"). */
export function Icon({ name, className, style }: IconProps) {
  const classes = className ? `fa-solid fa-${name} ${className}` : `fa-solid fa-${name}`
  return <i className={classes} style={style} aria-hidden="true" />
}

/** Mapa clave semántica de producto -> nombre de ícono Font Awesome. */
const PRODUCT_ICON_MAP: Record<IconKey, string> = {
  coffee: 'mug-hot',
  oil: 'droplet',
  cookie: 'cookie-bite',
  milk: 'bottle-water',
  generic: 'box',
  discount: 'percent',
  twoForOne: 'tags',
  category: 'layer-group',
  voucher: 'ticket',
  premium: 'crown',
}

/** Devuelve el nombre de ícono Font Awesome para un producto. */
export function productIconName(key: IconKey): string {
  return PRODUCT_ICON_MAP[key]
}

/** Devuelve el nombre de ícono Font Awesome para una recompensa (mismo mapa). */
export function rewardIconName(key: IconKey): string {
  return PRODUCT_ICON_MAP[key]
}
