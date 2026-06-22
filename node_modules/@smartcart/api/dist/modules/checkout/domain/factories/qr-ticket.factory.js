"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrTicketFactory = void 0;
class QrTicketFactory {
    static create(session, signer) {
        session.requestCheckout();
        return signer.sign({
            sessionId: session.id,
            userId: session.userId,
            itemHash: session.itemHash,
        });
    }
}
exports.QrTicketFactory = QrTicketFactory;
//# sourceMappingURL=qr-ticket.factory.js.map