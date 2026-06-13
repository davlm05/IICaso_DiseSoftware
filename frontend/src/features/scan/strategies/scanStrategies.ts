/**
 * Scan strategies (README §1.4 Application / Use Cases — Strategy pattern,
 * §1.9 `/features/scan/strategies/` — Camera, Manual).
 *
 * Both strategies resolve to the same output: a raw barcode string that is
 * then run through the scan-validation Chain of Responsibility
 * (`runScanValidationChain`). `useScan` (see `../../../hooks/useScan.ts`)
 * holds the active strategy and exposes a uniform `submit(barcode)` entry
 * point regardless of how the barcode was captured.
 */

export type ScanMode = "camera" | "manual";

export interface IScanStrategy {
  readonly mode: ScanMode;
  /** Human-readable label for the mode toggle. */
  readonly label: string;
}

export const CameraStrategy: IScanStrategy = {
  mode: "camera",
  label: "Cámara",
};

export const ManualEntryStrategy: IScanStrategy = {
  mode: "manual",
  label: "Ingreso manual",
};

export const SCAN_STRATEGIES: Record<ScanMode, IScanStrategy> = {
  camera: CameraStrategy,
  manual: ManualEntryStrategy,
};
