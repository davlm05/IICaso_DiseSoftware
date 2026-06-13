import type { ProductDTO } from "../../types";

/**
 * Scan-validation Chain of Responsibility (README §1.4 Application layer,
 * §1.5 operation 2: format -> location -> sponsored -> duplicate).
 *
 * Each handler returns a rejection reason string, or null to pass to the
 * next link. The chain stops at the first rejection.
 */

export interface ScanValidationContext {
  barcode: string;
  product: ProductDTO | null;
  locationVerified: boolean;
  pendingItems: ProductDTO[];
}

export type ScanRejection =
  | { code: "INVALID_FORMAT"; message: string }
  | { code: "OUT_OF_STORE"; message: string }
  | { code: "NOT_SPONSORED"; message: string }
  | { code: "DUPLICATE"; message: string };

type Handler = (ctx: ScanValidationContext) => ScanRejection | null;

const formatHandler: Handler = ({ barcode }) => {
  if (!/^\d{8,14}$/.test(barcode)) {
    return { code: "INVALID_FORMAT", message: "Código de barras inválido." };
  }
  return null;
};

const locationHandler: Handler = ({ locationVerified }) => {
  if (!locationVerified) {
    return {
      code: "OUT_OF_STORE",
      message: "Acércate a una tienda afiliada para sumar puntos.",
    };
  }
  return null;
};

const sponsoredHandler: Handler = ({ product }) => {
  if (!product || !product.sponsored) {
    return {
      code: "NOT_SPONSORED",
      message: "Producto no válido o ya está en tu lista.",
    };
  }
  return null;
};

const duplicateHandler: Handler = ({ product, pendingItems }) => {
  if (product && pendingItems.some((p) => p.id === product.id)) {
    return {
      code: "DUPLICATE",
      message: "Producto no válido o ya está en tu lista.",
    };
  }
  return null;
};

const chain: Handler[] = [formatHandler, locationHandler, sponsoredHandler, duplicateHandler];

/**
 * Runs the full chain. Returns the first rejection, or null if the scan is
 * valid and ready for `ScanConfirmationModal`.
 */
export function runScanValidationChain(ctx: ScanValidationContext): ScanRejection | null {
  for (const handler of chain) {
    const rejection = handler(ctx);
    if (rejection) return rejection;
  }
  return null;
}
