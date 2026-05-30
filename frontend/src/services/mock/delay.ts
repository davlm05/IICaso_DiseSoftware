import { env } from '@/config/env'

/** Simula latencia de red para la capa de servicios mock. */
export const delay = (ms: number = env.mockLatencyMs): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
