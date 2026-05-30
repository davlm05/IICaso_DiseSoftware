/**
 * SmartCart — Contrato de dominio compartido.
 *
 * Este archivo es la ÚNICA fuente de verdad de los tipos del dominio y de las
 * interfaces de los patrones de diseño (GoF). Toda la app (stores, servicios,
 * componentes, páginas, tests) consume estos tipos. No duplicar tipos en otros
 * archivos: importarlos desde aquí (`@/domain/models/types`).
 */

/* ------------------------------------------------------------------ */
/* Íconos (clave semántica -> clase Font Awesome, resuelta en <Icon/>) */
/* ------------------------------------------------------------------ */
export type IconKey =
  | 'coffee'
  | 'oil'
  | 'cookie'
  | 'milk'
  | 'generic'
  | 'discount'
  | 'twoForOne'
  | 'category'
  | 'voucher'
  | 'premium'

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

/** Producto patrocinado resuelto desde el catálogo de barcodes. */
export interface Product {
  id: string
  barcode: string // EAN-13
  name: string
  brand: string
  price: number // colones (CRC)
  iconKey: IconKey
  sponsored: boolean
  pointsOffered: number // puntos que otorga al validarse en caja
}

/** Línea de producto dentro de la sesión de compra (pendiente de validar). */
export interface ScannedProduct extends Product {
  scanId: string // id único de la línea escaneada
  scannedAt: number // epoch ms
  isNew: boolean // resaltado "Nuevo" (último escaneado)
  validated: boolean // true tras validación POS
}

/** Distintivos visuales aplicados por los Decorators de producto. */
export type ProductBadge = 'sponsored' | 'new' | 'validated' | 'locked'

/* ------------------------------------------------------------------ */
/* Ubicación / Tienda                                                 */
/* ------------------------------------------------------------------ */
export interface Store {
  id: string
  name: string // ej. "Super Buen Precio — Curridabat"
  chain: string // ej. "Super Buen Precio"
}

/* ------------------------------------------------------------------ */
/* Puntos                                                             */
/* ------------------------------------------------------------------ */
export interface PointsSnapshot {
  balance: number // puntos acreditados
  pendingThisSession: number // pendientes de validar en esta sesión
  nextRewardThreshold: number // meta para el próximo canje
}

/* ------------------------------------------------------------------ */
/* Recompensas (Factory Method)                                       */
/* ------------------------------------------------------------------ */
export type RewardType = 'discount' | 'twoForOne' | 'category' | 'voucher' | 'premium'
export type RewardGradient = 'discount' | 'coffee' | 'store' | 'premium'

export interface Reward {
  id: string
  type: RewardType
  name: string
  description: string
  cost: number // puntos requeridos
  expiresInDays: number | null
  iconKey: IconKey
  gradient: RewardGradient
  premium: boolean
  featured: boolean
}

/** Datos crudos del catálogo que la RewardFactory transforma en `Reward`. */
export interface RewardSeed {
  id: string
  type: RewardType
  name: string
  cost: number
  expiresInDays?: number | null
  featured?: boolean
}

/** Cupón ya canjeado por el usuario (pestaña "Mis cupones"). */
export interface RedeemedCoupon {
  id: string
  rewardId: string
  name: string
  code: string
  redeemedAt: number
  expiresInDays: number | null
}

/* ------------------------------------------------------------------ */
/* Validación / QR                                                    */
/* ------------------------------------------------------------------ */
export interface QrTicket {
  code: string // ej. "SC-2026-AX9K-7283"
  sessionId: string
  productCount: number
  pendingPoints: number
  expiresAt: number // epoch ms (generación + 10 min)
}

export interface ValidationResult {
  validated: boolean
  creditedPoints: number
  validatedProducts: ScannedProduct[]
}

/* ================================================================== */
/* PATRONES DE DISEÑO — interfaces (GoF)                              */
/* ================================================================== */

/* ---- State pattern: estados discretos de la ShoppingSession ------ */
export type SessionStateName = 'empty' | 'scanning' | 'withProducts' | 'validating' | 'confirmed'

/** Vista inmutable de las capacidades del estado actual (la consume la UI). */
export interface SessionStateView {
  readonly name: SessionStateName
  readonly canScan: boolean
  readonly canGenerateQr: boolean
  readonly canConfirm: boolean
}

/* ---- Command pattern --------------------------------------------- */
/** Mutaciones que un Command puede aplicar sobre la sesión (inyectadas). */
export interface SessionMutations {
  insertProduct(product: ScannedProduct): void
  deleteProduct(scanId: string): void
  restoreProduct(product: ScannedProduct, index: number): void
  setQrTicket(ticket: QrTicket | null): void
  applyValidation(result: ValidationResult): void
}

export interface Command {
  readonly label: string
  readonly canUndo: boolean
  execute(): void
  undo(): void
}

/* ---- Strategy pattern: captura de barcode ------------------------ */
export type BarcodeSource = 'camera' | 'manual'

export interface IBarcodeInputStrategy {
  readonly source: BarcodeSource
  /** Resuelve a un barcode EAN-13. `input` aplica a la estrategia manual. */
  capture(input?: string): Promise<string>
}

/* ---- Chain of Responsibility: pipeline de validación de escaneo --- */
export interface ScanContext {
  barcode: string
  store: Store | null
  existingBarcodes: string[]
}

export type ScanRejectCode = 'LOCATION' | 'FORMAT' | 'NOT_SPONSORED' | 'DUPLICATE'

export interface ScanCheckResult {
  ok: boolean
  code?: ScanRejectCode
  reason?: string
  product?: Product
}

export interface ScanHandler {
  setNext(handler: ScanHandler): ScanHandler
  handle(ctx: ScanContext): Promise<ScanCheckResult>
}

/* ---- Observer: eventos de dominio -------------------------------- */
export type DomainEventType =
  | 'PRODUCT_SCANNED'
  | 'PRODUCT_REMOVED'
  | 'QR_GENERATED'
  | 'SESSION_VALIDATED'
  | 'COUPON_REDEEMED'
  | 'SCAN_REJECTED'

export interface DomainEvent<T = unknown> {
  type: DomainEventType
  message?: string
  payload?: T
}

export type DomainEventListener<T = unknown> = (event: DomainEvent<T>) => void

/* ================================================================== */
/* Tipos transversales de UI                                          */
/* ================================================================== */
export type ToastTone = 'success' | 'pending' | 'error'

export interface ToastMessage {
  id: string
  text: string
  tone: ToastTone
  icon?: string // clase Font Awesome opcional
}
