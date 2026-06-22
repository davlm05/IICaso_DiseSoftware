"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCouponCode = generateCouponCode;
const node_crypto_1 = require("node:crypto");
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789';
function generateCouponCode() {
    const bytes = (0, node_crypto_1.randomBytes)(8);
    let out = '';
    for (let i = 0; i < 8; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
        if (i === 3)
            out += '-';
    }
    return `SC-${out}`;
}
//# sourceMappingURL=coupon-code.js.map