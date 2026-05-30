import type { QrTicket } from '@/domain/models/types'
import { Card, Icon, Pill } from '@/components/ui'
import { formatPoints } from '@/utils/format'
import styles from './QrPanel.module.css'

/** Props del panel del QR de validación. */
export interface QrPanelProps {
  ticket: QrTicket
  productCount: number
  pendingPoints: number
}

/**
 * Tarjeta blanca con el QR de validación (SVG decorativo/estático), el código
 * del ticket, la vigencia y un resumen de productos + puntos pendientes.
 */
export function QrPanel({ ticket, productCount, pendingPoints }: QrPanelProps) {
  return (
    <Card padding="var(--sc-sp-7)" className={styles.card}>
      {/* QR estático — replicado 1:1 del mockup (no codifica datos reales). */}
      <svg
        className={styles.qr}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Código QR de validación"
      >
        <rect width="200" height="200" fill="white" />
        {/* Marcadores de posición (esquinas). */}
        <rect x="10" y="10" width="40" height="40" fill="black" />
        <rect x="18" y="18" width="24" height="24" fill="white" />
        <rect x="24" y="24" width="12" height="12" fill="black" />
        <rect x="150" y="10" width="40" height="40" fill="black" />
        <rect x="158" y="18" width="24" height="24" fill="white" />
        <rect x="164" y="24" width="12" height="12" fill="black" />
        <rect x="10" y="150" width="40" height="40" fill="black" />
        <rect x="18" y="158" width="24" height="24" fill="white" />
        <rect x="24" y="164" width="12" height="12" fill="black" />
        {/* Patrón de datos decorativo. */}
        <g fill="black">
          <rect x="60" y="10" width="6" height="6" />
          <rect x="70" y="10" width="6" height="6" />
          <rect x="84" y="10" width="6" height="6" />
          <rect x="100" y="10" width="6" height="6" />
          <rect x="114" y="10" width="6" height="6" />
          <rect x="130" y="10" width="6" height="6" />
          <rect x="60" y="20" width="6" height="6" />
          <rect x="78" y="20" width="6" height="6" />
          <rect x="94" y="20" width="6" height="6" />
          <rect x="110" y="20" width="6" height="6" />
          <rect x="124" y="20" width="6" height="6" />
          <rect x="140" y="20" width="6" height="6" />
          <rect x="64" y="30" width="6" height="6" />
          <rect x="78" y="30" width="6" height="6" />
          <rect x="92" y="30" width="6" height="6" />
          <rect x="106" y="30" width="6" height="6" />
          <rect x="120" y="30" width="6" height="6" />
          <rect x="134" y="30" width="6" height="6" />
          <rect x="60" y="40" width="6" height="6" />
          <rect x="74" y="40" width="6" height="6" />
          <rect x="90" y="40" width="6" height="6" />
          <rect x="108" y="40" width="6" height="6" />
          <rect x="120" y="40" width="6" height="6" />
          <rect x="138" y="40" width="6" height="6" />
          <rect x="10" y="60" width="6" height="6" />
          <rect x="24" y="60" width="6" height="6" />
          <rect x="38" y="60" width="6" height="6" />
          <rect x="54" y="60" width="6" height="6" />
          <rect x="70" y="60" width="6" height="6" />
          <rect x="84" y="60" width="6" height="6" />
          <rect x="100" y="60" width="6" height="6" />
          <rect x="114" y="60" width="6" height="6" />
          <rect x="130" y="60" width="6" height="6" />
          <rect x="144" y="60" width="6" height="6" />
          <rect x="158" y="60" width="6" height="6" />
          <rect x="174" y="60" width="6" height="6" />
          <rect x="14" y="74" width="6" height="6" />
          <rect x="30" y="74" width="6" height="6" />
          <rect x="48" y="74" width="6" height="6" />
          <rect x="64" y="74" width="6" height="6" />
          <rect x="80" y="74" width="6" height="6" />
          <rect x="94" y="74" width="6" height="6" />
          <rect x="110" y="74" width="6" height="6" />
          <rect x="126" y="74" width="6" height="6" />
          <rect x="140" y="74" width="6" height="6" />
          <rect x="156" y="74" width="6" height="6" />
          <rect x="170" y="74" width="6" height="6" />
          <rect x="184" y="74" width="6" height="6" />
          <rect x="22" y="88" width="6" height="6" />
          <rect x="38" y="88" width="6" height="6" />
          <rect x="54" y="88" width="6" height="6" />
          <rect x="68" y="88" width="6" height="6" />
          <rect x="84" y="88" width="6" height="6" />
          <rect x="100" y="88" width="6" height="6" />
          <rect x="116" y="88" width="6" height="6" />
          <rect x="130" y="88" width="6" height="6" />
          <rect x="146" y="88" width="6" height="6" />
          <rect x="162" y="88" width="6" height="6" />
          <rect x="178" y="88" width="6" height="6" />
          <rect x="10" y="102" width="6" height="6" />
          <rect x="28" y="102" width="6" height="6" />
          <rect x="42" y="102" width="6" height="6" />
          <rect x="58" y="102" width="6" height="6" />
          <rect x="74" y="102" width="6" height="6" />
          <rect x="90" y="102" width="6" height="6" />
          <rect x="106" y="102" width="6" height="6" />
          <rect x="120" y="102" width="6" height="6" />
          <rect x="136" y="102" width="6" height="6" />
          <rect x="152" y="102" width="6" height="6" />
          <rect x="168" y="102" width="6" height="6" />
          <rect x="184" y="102" width="6" height="6" />
          <rect x="18" y="116" width="6" height="6" />
          <rect x="34" y="116" width="6" height="6" />
          <rect x="50" y="116" width="6" height="6" />
          <rect x="66" y="116" width="6" height="6" />
          <rect x="82" y="116" width="6" height="6" />
          <rect x="98" y="116" width="6" height="6" />
          <rect x="114" y="116" width="6" height="6" />
          <rect x="128" y="116" width="6" height="6" />
          <rect x="144" y="116" width="6" height="6" />
          <rect x="158" y="116" width="6" height="6" />
          <rect x="174" y="116" width="6" height="6" />
          <rect x="10" y="130" width="6" height="6" />
          <rect x="26" y="130" width="6" height="6" />
          <rect x="42" y="130" width="6" height="6" />
          <rect x="58" y="130" width="6" height="6" />
          <rect x="72" y="130" width="6" height="6" />
          <rect x="88" y="130" width="6" height="6" />
          <rect x="104" y="130" width="6" height="6" />
          <rect x="118" y="130" width="6" height="6" />
          <rect x="134" y="130" width="6" height="6" />
          <rect x="150" y="130" width="6" height="6" />
          <rect x="166" y="130" width="6" height="6" />
          <rect x="182" y="130" width="6" height="6" />
          <rect x="60" y="146" width="6" height="6" />
          <rect x="76" y="146" width="6" height="6" />
          <rect x="90" y="146" width="6" height="6" />
          <rect x="106" y="146" width="6" height="6" />
          <rect x="122" y="146" width="6" height="6" />
          <rect x="136" y="146" width="6" height="6" />
          <rect x="152" y="146" width="6" height="6" />
          <rect x="168" y="146" width="6" height="6" />
          <rect x="184" y="146" width="6" height="6" />
          <rect x="64" y="160" width="6" height="6" />
          <rect x="80" y="160" width="6" height="6" />
          <rect x="94" y="160" width="6" height="6" />
          <rect x="110" y="160" width="6" height="6" />
          <rect x="126" y="160" width="6" height="6" />
          <rect x="142" y="160" width="6" height="6" />
          <rect x="158" y="160" width="6" height="6" />
          <rect x="172" y="160" width="6" height="6" />
          <rect x="60" y="174" width="6" height="6" />
          <rect x="76" y="174" width="6" height="6" />
          <rect x="92" y="174" width="6" height="6" />
          <rect x="108" y="174" width="6" height="6" />
          <rect x="122" y="174" width="6" height="6" />
          <rect x="138" y="174" width="6" height="6" />
          <rect x="154" y="174" width="6" height="6" />
          <rect x="168" y="174" width="6" height="6" />
          <rect x="184" y="174" width="6" height="6" />
        </g>
      </svg>

      {/* Código del ticket y vigencia. */}
      <div className={styles.info}>
        <div className={styles.code}>{ticket.code}</div>
        <div className={styles.expires}>
          <Icon name="clock" />
          <span>Válido por 10 minutos</span>
        </div>
      </div>

      {/* Resumen: productos pendientes + puntos por acreditar. */}
      <div className={styles.summary}>
        <div className={styles.summaryLeft}>
          <strong>{productCount} productos</strong> pendientes de validar
        </div>
        <Pill variant="points">{formatPoints(pendingPoints)} pts</Pill>
      </div>
    </Card>
  )
}
