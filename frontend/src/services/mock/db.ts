/**
 * Base de datos simulada (mock).
 *
 * Única fuente de datos del frontend mientras no exista backend (Fase 3).
 * Los valores replican los mockups de Figma (DesignContext/figmaScreens/*.html).
 * En la Fase 3, los servicios sustituirán estas lecturas por llamadas HTTP.
 */
import type { PointsSnapshot, Product, RewardSeed, Store } from '@/domain/models/types'

/** Tienda actual (resuelta por GPS/BLE — aquí simulada). */
export const MOCK_STORE: Store = {
  id: 'store-001',
  name: 'Super Buen Precio — Curridabat',
  chain: 'Super Buen Precio',
}

/** Saldo de puntos inicial del usuario (mockup 1: 120 / 200). */
export const INITIAL_POINTS: PointsSnapshot = {
  balance: 120,
  pendingThisSession: 0,
  nextRewardThreshold: 200,
}

/** Usuario demo (auth mock). */
export const MOCK_USER = {
  id: 'user-001',
  name: 'Juan Corrales',
  initials: 'JC',
  email: 'juan.corrales@smartcart.cr',
}

/**
 * Catálogo de productos patrocinados, indexado por barcode (EAN-13).
 * El barcode de Café Britt comienza con 7441001823 para coincidir con el
 * ingreso manual parcial mostrado en el mockup 2B.
 */
export const PRODUCT_CATALOG: Record<string, Product> = {
  '7441001823456': {
    id: 'prod-britt',
    barcode: '7441001823456',
    name: 'Cafe Britt 500g',
    brand: 'Cafe Britt',
    price: 3250,
    iconKey: 'coffee',
    sponsored: true,
    pointsOffered: 15,
  },
  '7441002910001': {
    id: 'prod-numar',
    barcode: '7441002910001',
    name: 'Aceite Numar 1L',
    brand: 'Numar',
    price: 2890,
    iconKey: 'oil',
    sponsored: true,
    pointsOffered: 10,
  },
  '7441003700002': {
    id: 'prod-pozuelo',
    barcode: '7441003700002',
    name: 'Galletas Pozuelo',
    brand: 'Pozuelo',
    price: 1450,
    iconKey: 'cookie',
    sponsored: true,
    pointsOffered: 8,
  },
  '7441004500003': {
    id: 'prod-dospinos',
    barcode: '7441004500003',
    name: 'Leche Dos Pinos 1L',
    brand: 'Dos Pinos',
    price: 1100,
    iconKey: 'milk',
    sponsored: true,
    pointsOffered: 5,
  },
}

/** Productos destacados del carrusel "Productos con puntos hoy" (mockup 1). */
export const SPONSORED_TODAY: string[] = [
  '7441001823456',
  '7441002910001',
  '7441003700002',
]

/**
 * Semillas de recompensas (mockup 7). La RewardFactory las transforma en
 * objetos `Reward` con gradiente/ícono/flags derivados de su tipo.
 */
export const REWARD_SEEDS: RewardSeed[] = [
  { id: 'rw-15', type: 'discount', name: '-15% en tu compra', cost: 100, featured: true },
  { id: 'rw-2x1', type: 'twoForOne', name: '2x1 en cafe Britt', cost: 75, expiresInDays: 30 },
  { id: 'rw-lacteos', type: 'category', name: '-10% en lacteos', cost: 50, expiresInDays: 15 },
  { id: 'rw-bono', type: 'voucher', name: 'Bono de 5,000 colones', cost: 300, expiresInDays: 60 },
  { id: 'rw-gratis', type: 'premium', name: 'Compra gratis', cost: 500, expiresInDays: null },
]
