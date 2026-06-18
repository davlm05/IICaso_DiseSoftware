import { randomBytes } from 'node:crypto';

/**
 * Coupon code value object (README §2.4 Redemption.couponCode unique).
 * Format: SC-XXXX-XXXX (Crockford-ish base32, no ambiguous chars).
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789';

export function generateCouponCode(): string {
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3) out += '-';
  }
  return `SC-${out}`;
}
