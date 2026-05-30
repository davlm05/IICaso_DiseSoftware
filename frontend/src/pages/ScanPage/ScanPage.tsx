import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '@/components/layout'
import { Button, Icon } from '@/components/ui'
import { useScanner } from '@/hooks/useScanner'
import { useShoppingSession } from '@/hooks/useShoppingSession'
import { PATHS } from '@/router/paths'
import styles from './ScanPage.module.css'

/** Cantidad de barras del código de barras decorativo (mockup 2). */
const BARCODE_BARS = Array.from({ length: 15 }, (_, i) => i)

/**
 * ScanPage — vista de cámara para escanear el código de barras (mockup 2).
 * Reproduce la cámara oscura con marco de escaneo verde y línea animada.
 * Al tocar el marco se dispara `scan()`; si valida, vuelve al home.
 */
export default function ScanPage() {
  const navigate = useNavigate()
  const { store } = useShoppingSession()
  const { setSource, scan } = useScanner()

  // La fuente activa es la cámara mientras esta pantalla esté montada.
  useEffect(() => {
    setSource('camera')
  }, [setSource])

  /** Simula el enfoque del código: captura y valida vía la cámara. */
  const handleScan = async () => {
    const ok = await scan()
    if (ok) navigate(PATHS.home)
  }

  return (
    <PhoneShell background="dark" contentPadding={false}>
      <div className={styles.camera}>
        {/* Controles superiores: cerrar · título · flash. */}
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Cerrar"
            onClick={() => navigate(PATHS.home)}
          >
            <Icon name="xmark" />
          </button>
          <span className={styles.title}>Escanear producto</span>
          <button type="button" className={styles.iconBtn} aria-label="Flash">
            <Icon name="bolt" />
          </button>
        </div>

        {/* Área de cámara con instrucción y marco de escaneo. */}
        <div className={styles.viewport}>
          <div className={styles.instruction}>
            <span className={styles.instructionText}>Apunta al codigo de barras</span>
          </div>

          <button
            type="button"
            className={styles.frame}
            aria-label="Enfocar código de barras"
            onClick={handleScan}
          >
            <span className={`${styles.corner} ${styles.tl}`} />
            <span className={`${styles.corner} ${styles.tr}`} />
            <span className={`${styles.corner} ${styles.bl}`} />
            <span className={`${styles.corner} ${styles.br}`} />
            <span className={styles.barcode} aria-hidden="true">
              {BARCODE_BARS.map((bar) => (
                <span key={bar} />
              ))}
            </span>
            <span className={styles.scanLine} aria-hidden="true" />
          </button>
        </div>

        {/* Panel inferior: ubicación verificada + ingreso manual. */}
        <div className={styles.bottomPanel}>
          <div className={styles.locationPill}>
            <Icon name="location-dot" className={styles.locationIcon} />
            <span className={styles.locationText}>
              Ubicacion verificada · <strong>{store?.chain ?? 'Super Buen Precio'}</strong>
            </span>
          </div>
          <Button
            variant="secondary"
            icon="keyboard"
            fullWidth
            onClick={() => navigate(PATHS.scanManual)}
          >
            Ingresar codigo manualmente
          </Button>
        </div>
      </div>
    </PhoneShell>
  )
}
