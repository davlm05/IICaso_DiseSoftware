/** Rutas de la aplicación (única fuente de verdad para navegación). */
export const PATHS = {
  home: '/',
  scan: '/scan',
  scanManual: '/scan/manual',
  qr: '/qr',
  confirmation: '/confirmation',
  rewards: '/rewards',
  profile: '/profile',
} as const

export type AppPath = (typeof PATHS)[keyof typeof PATHS]
