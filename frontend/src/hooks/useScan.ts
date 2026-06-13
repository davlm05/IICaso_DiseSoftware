import { useState } from "react";
import type { Product } from "../components/molecules/ProductCard";
import { findProductByBarcode } from "../features/catalog/mockCatalog";
import {
  CameraStrategy,
  ManualEntryStrategy,
  type IScanStrategy,
  type ScanMode,
} from "../features/scan/strategies/scanStrategies";
import { runScanValidationChain } from "../features/scan/validation/scanValidationChain";
import { AddItemCommand } from "../features/session/commands/sessionCommands";
import { useSessionStore } from "../store/sessionStore";

/**
 * useScan (README §1.2 ScanScreen — "calls useScan (Strategy: camera/manual)",
 * §1.9 `/hooks/`).
 *
 * Owns the active scan Strategy (camera vs. manual entry), runs every
 * captured barcode through the validation Chain of Responsibility, and
 * surfaces the result for ScanConfirmationModal. Confirming dispatches
 * AddItemCommand against the session store (Command + undo, §1.4).
 */
export function useScan() {
  const store = useSessionStore();
  const pending = useSessionStore((s) => s.pendingItems);
  const locationVerified = useSessionStore((s) => s.locationVerified);
  const storeName = useSessionStore((s) => s.storeName);

  const [strategy, setStrategy] = useState<IScanStrategy>(CameraStrategy);
  const [scanned, setScanned] = useState<Product | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const setMode = (mode: ScanMode) => {
    setRejection(null);
    setStrategy(mode === "camera" ? CameraStrategy : ManualEntryStrategy);
  };

  /** Runs a captured barcode (from either strategy) through the CoR chain. */
  const submit = (barcode: string) => {
    if (scanned) return; // ignore extra reads while the confirmation modal is open

    const product = findProductByBarcode(barcode);
    const result = runScanValidationChain({
      barcode,
      product,
      locationVerified,
      pendingItems: pending,
    });

    if (result) {
      setRejection(result.message);
      return false;
    }

    setRejection(null);
    setScanned(product);
    return true;
  };

  const confirm = () => {
    if (!scanned) return;
    new AddItemCommand(store, scanned as never).execute();
    setScanned(null);
  };

  const cancel = () => setScanned(null);
  const dismissRejection = () => setRejection(null);

  return {
    strategy,
    mode: strategy.mode,
    setMode,
    scanned,
    rejection,
    submit,
    confirm,
    cancel,
    dismissRejection,
    locationVerified,
    storeName,
  };
}
