import type { ProductDTO } from "../../../types";
import type { SessionState } from "../../../store/sessionStore";

/**
 * Command objects (README §1.4 Application / Use Cases, §1.5 operations 1-3, 6).
 * Each command wraps a session-store mutation and exposes `execute`/`undo`
 * where the operation is reversible.
 */

export interface Command {
  execute(): void;
  undo?(): void;
}

/** Adds a scanned product to the pending list. Reversible via RemoveProductCommand. */
export class AddItemCommand implements Command {
  constructor(private store: SessionState, private product: ProductDTO) {}

  execute(): void {
    this.store.addItem(this.product);
  }

  undo(): void {
    this.store.removeItem(this.product.id);
  }
}

/** Removes an item from the pending list (red X). Reversible by re-adding it. */
export class RemoveProductCommand implements Command {
  constructor(private store: SessionState, private product: ProductDTO) {}

  execute(): void {
    this.store.removeItem(this.product.id);
  }

  undo(): void {
    this.store.addItem(this.product);
  }
}

/** Requests the checkout QR. Non-idempotent — no auto-retry (README §1.5 op. 3). */
export class GenerateQRCommand implements Command {
  constructor(private store: SessionState) {}

  execute(): void {
    this.store.generateQr();
  }
}

/** Redeems points for a reward. Non-idempotent — no auto-retry (README §1.5 op. 6). */
export class RedeemCouponCommand implements Command {
  constructor(private store: SessionState, private cost: number) {}

  execute(): void {
    this.store.redeemReward(this.cost);
  }
}
