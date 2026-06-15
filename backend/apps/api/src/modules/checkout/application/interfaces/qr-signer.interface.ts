/**
 * QR signing port (README §2.3 §2). Implemented by JwtQrSigner in
 * infrastructure; the application/domain layers depend only on this interface.
 */
export interface QrPayload {
  sessionId: string;
  userId: string;
  itemHash: string;
}

export interface SignedQr {
  token: string;
  expiresAt: Date;
}

export interface IQrSigner {
  /** Sign a 10-minute HS256 token; expiry is owned by the signer. */
  sign(payload: QrPayload): SignedQr;
  /** Verify signature + expiry; throws typed QR errors on failure. */
  verify(token: string): QrPayload;
}

export const QR_SIGNER = Symbol('QR_SIGNER');
