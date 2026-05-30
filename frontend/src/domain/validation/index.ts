/** Barrel — Chain of Responsibility de validación de escaneo. */
export { BaseScanHandler } from './ScanHandler'
export { LocationHandler } from './LocationHandler'
export { BarcodeFormatHandler } from './BarcodeFormatHandler'
export { SponsoredProductHandler } from './SponsoredProductHandler'
export { DuplicateScanHandler } from './DuplicateScanHandler'
export { buildScanChain, runScanChain } from './buildScanChain'
