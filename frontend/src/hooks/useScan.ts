import { useRef, useState } from "react";
import axios from "axios";
import { client } from "../api/client";
import { mapBackendProduct } from "../api/mappers";
import type { BackendProduct, ProductDTO } from "../types";
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
 * Owns the active scan Strategy (camera vs. manual entry). Each captured
 * barcode is resolved against `GET /products/:barcode`, run through the
 * validation Chain of Responsibility, and surfaced for ScanConfirmationModal.
 * Confirming dispatches AddItemCommand (POST /sessions/:id/items) against the
 * session store (Command + undo, §1.4).
 */
export function useScan() {
  const store = useSessionStore();
  const pending = useSessionStore((s) => s.pendingItems);
  const locationVerified = useSessionStore((s) => s.locationVerified);
  const storeName = useSessionStore((s) => s.storeName);

  const [strategy, setStrategy] = useState<IScanStrategy>(CameraStrategy);
  const [scanned, setScanned] = useState<ProductDTO | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Guards against the camera firing repeated reads before state settles.
  const resolving = useRef(false);

  const setMode = (mode: ScanMode) => {
    setRejection(null);
    setStrategy(mode === "camera" ? CameraStrategy : ManualEntryStrategy);
  };

  /** Resolves a captured barcode via the API, then runs the CoR chain. */
  const submit = async (barcode: string) => {
    if (scanned || resolving.current) return false; // ignore extra reads
    resolving.current = true;
    setBusy(true);

    try {
      let product: ProductDTO | null = null;
      try {
        const { data } = await client.get<BackendProduct>(`/products/${barcode}`);
        product = mapBackendProduct(data);
      } catch (err) {
        // 404 (unknown barcode) and 400 (bad format) fall through as a null
        // product; the validation chain turns that into a rejection.
        if (!axios.isAxiosError(err) || ![400, 404].includes(err.response?.status ?? 0)) {
          throw err;
        }
      }

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
    } catch {
      setRejection("No pudimos verificar el producto. Intenta de nuevo.");
      return false;
    } finally {
      resolving.current = false;
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!scanned) return;
    const product = scanned;
    setScanned(null);
    try {
      await new AddItemCommand(store, product).execute();
    } catch {
      setRejection("No pudimos agregar el producto. Intenta de nuevo.");
    }
  };

  const cancel = () => setScanned(null);
  const dismissRejection = () => setRejection(null);

  return {
    strategy,
    mode: strategy.mode,
    setMode,
    scanned,
    rejection,
    busy,
    submit,
    confirm,
    cancel,
    dismissRejection,
    locationVerified,
    storeName,
  };
}
