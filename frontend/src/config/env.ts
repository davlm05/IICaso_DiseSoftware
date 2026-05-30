/**
 * Configuración de entorno. En la Fase 3 (backend) estos valores vendrán de
 * `import.meta.env.*` (variables Vite) en lugar de constantes.
 */
export const env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,

  /** Latencia simulada de la capa de servicios mock (ms). */
  mockLatencyMs: 300,

  /** Tiempo hasta que la "cajera" valida el QR automáticamente en la demo (ms). */
  qrAutoValidateMs: 6_000,

  /** Vigencia del QR de validación (10 minutos). */
  qrValidityMs: 10 * 60 * 1_000,

  /** Intervalo de polling al POS para conocer el estado de validación (ms). */
  qrPollIntervalMs: 2_000,
} as const
