import { test, expect } from '@playwright/test'

/**
 * Smoke E2E del flujo principal de SmartCart.
 *
 * Recorre el camino feliz completo: escanear dos productos patrocinados
 * (Cafe Britt y Aceite Numar), generar el QR de salida, simular la validacion
 * de la cajera y confirmar los puntos acreditados.
 *
 * Notas:
 * - Se usa baseURL del playwright.config.ts (rutas relativas, sin puerto hardcodeado).
 * - Los servicios mock tienen latencia (~300 ms) y las rutas se cargan con lazy
 *   chunks, por eso se emplean timeouts holgados en las aserciones de visibilidad.
 * - El catalogo escaneado por la camara rota de forma determinista sobre
 *   SPONSORED_TODAY: 1er escaneo -> Cafe Britt (+15), 2do escaneo -> Aceite Numar (+10).
 */
test('flujo principal: escanear, generar QR, validar y confirmar puntos', async ({ page }) => {
  // Timeout amplio por la latencia mock + carga de chunks perezosos.
  const visible = { timeout: 15_000 }

  // 1) Home: estado inicial con el CTA de escaneo.
  await page.goto('/')
  const escanearProducto = page.getByRole('button', { name: 'Escanear producto' })
  await expect(escanearProducto).toBeVisible(visible)

  // 2) Ir a /scan y enfocar el marco de escaneo (1er producto: Cafe Britt).
  await escanearProducto.click()
  const enfocar = page.getByRole('button', { name: 'Enfocar código de barras' })
  await expect(enfocar).toBeVisible(visible)
  await enfocar.click()

  // 3) De vuelta en Home con el primer producto y sus puntos pendientes.
  await expect(page.getByText('Cafe Britt 500g')).toBeVisible(visible)
  await expect(page.getByText('+15 Pendientes')).toBeVisible(visible)

  // 4) Escanear otro producto (2do producto: Aceite Numar).
  const escanearOtro = page.getByRole('button', { name: 'Escanear otro producto' })
  await expect(escanearOtro).toBeVisible(visible)
  await escanearOtro.click()
  const enfocar2 = page.getByRole('button', { name: 'Enfocar código de barras' })
  await expect(enfocar2).toBeVisible(visible)
  await enfocar2.click()

  // 5) De vuelta en Home con dos productos: aparece el CTA de generar QR.
  const generarQr = page.getByRole('button', { name: 'Generar QR de salida' })
  await expect(generarQr).toBeVisible(visible)
  await generarQr.click()

  // 6) /qr: pantalla de validacion; simular la validacion de la cajera.
  await expect(page.getByText('Validacion de compra')).toBeVisible(visible)
  const simularValidacion = page.getByRole('button', { name: 'Simular validacion de cajera' })
  await expect(simularValidacion).toBeVisible(visible)
  await simularValidacion.click()

  // 7) /confirmation: puntos acreditados y total (120 saldo + 15 + 10 = 145).
  await expect(page.getByText('Puntos acreditados')).toBeVisible(visible)
  await expect(page.getByText(/145/)).toBeVisible(visible)
})
