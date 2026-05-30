import type { ToastTone } from '@/domain/models/types'
import { Icon } from '@/components/ui/Icon'
import styles from './Toast.module.css'

/** Props del toast de feedback. */
export interface ToastProps {
  text: string
  tone?: ToastTone
  /** Nombre de ícono Font Awesome (sin prefijo "fa-"). */
  icon?: string
  /** Si es false, no renderiza nada. */
  visible?: boolean
}

/** Ícono por defecto según el tono. */
const DEFAULT_ICON: Record<ToastTone, string> = {
  success: 'check',
  pending: 'clock',
  error: 'xmark',
}

/** Clase de tono del módulo CSS. */
const TONE_CLASS: Record<ToastTone, string> = {
  success: styles.success,
  pending: styles.pending,
  error: styles.error,
}

/** Mensaje emergente con ícono; aparece con la animación sc-toast-in. */
export function Toast({ text, tone = 'success', icon, visible = true }: ToastProps) {
  if (!visible) return null

  const iconName = icon ?? DEFAULT_ICON[tone]

  return (
    <div className={`${styles.toast} ${TONE_CLASS[tone]}`} role="status" aria-live="polite">
      <span className={styles.iconWrap}>
        <Icon name={iconName} />
      </span>
      <div className={styles.text}>{text}</div>
    </div>
  )
}
