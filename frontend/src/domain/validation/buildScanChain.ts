/**
 * Ensambla la cadena de validación de escaneo y expone un runner de conveniencia.
 * Orden: Location -> Format -> Sponsored -> Duplicate.
 */
import type { ScanCheckResult, ScanContext, ScanHandler } from '@/domain/models/types'
import { BarcodeFormatHandler } from './BarcodeFormatHandler'
import { DuplicateScanHandler } from './DuplicateScanHandler'
import { LocationHandler } from './LocationHandler'
import { SponsoredProductHandler } from './SponsoredProductHandler'

/** Construye la cadena y retorna la cabeza (LocationHandler). */
export function buildScanChain(): ScanHandler {
  const location = new LocationHandler()
  const format = new BarcodeFormatHandler()
  const sponsored = new SponsoredProductHandler()
  const duplicate = new DuplicateScanHandler()

  // setNext retorna el handler recibido, permitiendo encadenar fluidamente.
  location.setNext(format)
  format.setNext(sponsored)
  sponsored.setNext(duplicate)

  return location
}

/** Conveniencia: arma la cadena y valida el contexto de escaneo dado. */
export function runScanChain(ctx: ScanContext): Promise<ScanCheckResult> {
  return buildScanChain().handle(ctx)
}
