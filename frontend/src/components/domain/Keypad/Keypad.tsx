import { Icon } from '@/components/ui'
import styles from './Keypad.module.css'

export interface KeypadProps {
  /** Se invoca con el dígito presionado ('0'-'9'). */
  onKey: (digit: string) => void
  /** Borra el último dígito ingresado. */
  onDelete: () => void
  /** Cambia a captura por cámara. */
  onCamera: () => void
}

/** Dígitos de las tres primeras filas (1-9). */
const TOP_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/**
 * Teclado numérico 3x4 para ingreso manual del código de barras.
 * Última fila: cámara (acción verde), 0 y borrar (acción roja).
 */
export function Keypad({ onKey, onDelete, onCamera }: KeypadProps) {
  return (
    <div className={styles.keypad}>
      {TOP_DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className={styles.key}
          aria-label={`Dígito ${digit}`}
          onClick={() => onKey(digit)}
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        className={`${styles.key} ${styles.action}`}
        aria-label="Usar cámara"
        onClick={onCamera}
      >
        <Icon name="camera" />
      </button>

      <button
        type="button"
        className={styles.key}
        aria-label="Dígito 0"
        onClick={() => onKey('0')}
      >
        0
      </button>

      <button
        type="button"
        className={`${styles.key} ${styles.action} ${styles.delete}`}
        aria-label="Borrar último dígito"
        onClick={onDelete}
      >
        <Icon name="delete-left" />
      </button>
    </div>
  )
}
