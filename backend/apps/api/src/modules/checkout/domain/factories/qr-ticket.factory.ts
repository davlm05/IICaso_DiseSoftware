import type {
  IQrSigner,
  SignedQr,
} from '../../application/interfaces/qr-signer.interface';
import type { ShoppingSession } from '../entities/shopping-session.entity';

/**
 * Builds the checkout QR ticket (README §2.3 §2). Transitions the session to
 * PENDING_CHECKOUT (which computes + stores the item hash) and signs a token
 * embedding that hash. Returns the signed token + expiry.
 */
export class QrTicketFactory {
  static create(session: ShoppingSession, signer: IQrSigner): SignedQr {
    session.requestCheckout(); // guards items > 0, sets itemHash
    return signer.sign({
      sessionId: session.id,
      userId: session.userId,
      itemHash: session.itemHash as string,
    });
  }
}
