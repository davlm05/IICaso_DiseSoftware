"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShoppingSession = void 0;
const node_crypto_1 = require("node:crypto");
const checkout_errors_1 = require("../errors/checkout.errors");
const session_state_machine_1 = require("../state-machine/session-state-machine");
class ShoppingSession {
    constructor(props) {
        this.props = props;
    }
    static reconstitute(props) {
        return new ShoppingSession(props);
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get storeId() {
        return this.props.storeId;
    }
    get status() {
        return this.props.status;
    }
    get items() {
        return this.props.items;
    }
    get itemHash() {
        return this.props.itemHash;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    apply(event) {
        this.props.status = (0, session_state_machine_1.nextStatus)(this.props.status, event);
    }
    requestCheckout() {
        if (this.props.items.length === 0)
            throw new checkout_errors_1.EmptySessionError();
        this.apply('REQUEST_CHECKOUT');
        this.props.itemHash = this.computeItemHash();
    }
    completeValidation() {
        this.apply('COMPLETE_VALIDATION');
    }
    markValidationFailed() {
        this.apply('MARK_VALIDATION_FAILED');
    }
    expire() {
        this.apply('EXPIRE');
    }
    computeItemHash() {
        return ShoppingSession.hashBarcodes(this.props.items.map((i) => i.barcode));
    }
    validateItems(scannedBarcodes) {
        const expected = this.props.itemHash ?? this.computeItemHash();
        if (ShoppingSession.hashBarcodes(scannedBarcodes) !== expected) {
            throw new checkout_errors_1.QrItemMismatchError();
        }
    }
    static hashBarcodes(barcodes) {
        const canonical = [...barcodes].sort().join('|');
        return (0, node_crypto_1.createHash)('sha256').update(canonical).digest('hex');
    }
    totalPoints() {
        return this.props.items.reduce((sum, i) => sum + i.pointsValue, 0);
    }
}
exports.ShoppingSession = ShoppingSession;
//# sourceMappingURL=shopping-session.entity.js.map