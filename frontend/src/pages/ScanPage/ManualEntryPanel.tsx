import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell, TopBar } from '@/components/layout'
import { Button, Icon } from '@/components/ui'
import { Keypad } from '@/components/domain/Keypad'
import { useScanner } from '@/hooks/useScanner'
import { useShoppingSession } from '@/hooks/useShoppingSession'
import { PATHS } from '@/router/paths'
import styles from './ManualEntryPanel.module.css'

/** Longitud de un código EAN-13. */
const EAN13_LENGTH = 13
/** Placeholder del display cuando no hay dígitos. */
const PLACEHOLDER = '0'.repeat(EAN13_LENGTH)

/**
 * ManualEntryPanel — ingreso manual del código de barras (mockup 2B).
 * Teclado numérico que arma un EAN-13 y lo valida vía la estrategia manual.
 */
export default function ManualEntryPanel() {
  const navigate = useNavigate()
  const { store } = useShoppingSession()
  const { setSource, scan, lastError } = useScanner()
  const [value, setValue] = useState('')

  // La fuente activa es el ingreso manual mientras esta pantalla esté montada.
  useEffect(() => {
    setSource('manual')
  }, [setSource])

  /** Agrega un dígito hasta completar el EAN-13. */
  const addDigit = (digit: string) => {
    setValue((prev) => (prev.length < EAN13_LENGTH ? prev + digit : prev))
  }

  /** Borra el último dígito ingresado. */
  const removeDigit = () => {
    setValue((prev) => prev.slice(0, -1))
  }

  /** Valida el código completo; si es aceptado, vuelve al home. */
  const handleVerify = async () => {
    const ok = await scan(value)
    if (ok) navigate(PATHS.home)
  }

  const isComplete = value.length === EAN13_LENGTH

  return (
    <PhoneShell
      background="app"
      header={
        <TopBar mode="back" title="Ingresar codigo manual" onBack={() => navigate(PATHS.scan)} />
      }
    >
      {/* Cabecera con instrucción. */}
      <div className={styles.headerCard}>
        <div className={styles.headerIcon}>
          <Icon name="keyboard" />
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Codigo de barras</div>
          <div className={styles.headerSub}>
            Ingresa los 13 digitos que aparecen debajo del codigo del producto
          </div>
        </div>
      </div>

      {/* Ubicación actual. */}
      <div className={styles.locPill}>
        <span className={styles.locDot} />
        <span className={styles.locText}>
          Estas en <strong>{store?.name ?? 'Super Buen Precio — Curridabat'}</strong>
        </span>
        <Icon name="location-dot" className={styles.locIcon} />
      </div>

      {/* Display del código ingresado. */}
      <div>
        <div className={styles.inputLabel}>Codigo de barras (EAN-13)</div>
        <div className={styles.inputWrap}>
          <Icon name="barcode" className={styles.inputIcon} />
          <div className={`${styles.inputBox} ${value ? '' : styles.placeholder}`}>
            {value || PLACEHOLDER}
          </div>
        </div>
        <div className={styles.inputHint}>{value.length} / 13 digitos ingresados</div>
        {lastError ? <div className={styles.inputError}>{lastError}</div> : null}
      </div>

      {/* Ayuda: dónde encontrar el código. */}
      <div className={styles.helpTip}>
        <Icon name="circle-info" className={styles.helpIcon} />
        <div className={styles.helpText}>
          <strong>¿Donde encuentro el codigo?</strong>
          <br />
          Es la secuencia de numeros que aparece debajo de las lineas negras del codigo de barras
          del producto.
        </div>
      </div>

      {/* Teclado numérico. */}
      <Keypad onKey={addDigit} onDelete={removeDigit} onCamera={() => navigate(PATHS.scan)} />

      {/* Acción de verificación. */}
      <Button
        variant="primary"
        icon="check"
        fullWidth
        disabled={!isComplete}
        onClick={handleVerify}
      >
        Verificar producto
      </Button>
    </PhoneShell>
  )
}
