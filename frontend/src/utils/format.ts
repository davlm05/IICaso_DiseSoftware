/** Utilidades de formato compartidas (consistencia visual con los mockups). */

/** Formatea colones con separador de miles tipo "3,250" (como en los mockups). */
export const formatColones = (n: number): string => n.toLocaleString('en-US')

/** Formatea puntos con signo, ej. "+15". */
export const formatPoints = (n: number): string => `${n > 0 ? '+' : ''}${n}`

/** Porcentaje acotado a [0, 100] para barras de progreso. */
export const clampPercent = (value: number, max: number): number => {
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, (value / max) * 100))
}
