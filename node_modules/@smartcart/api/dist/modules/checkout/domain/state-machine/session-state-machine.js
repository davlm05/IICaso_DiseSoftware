"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextStatus = nextStatus;
const checkout_errors_1 = require("../errors/checkout.errors");
const TABLE = {
    ACTIVE: {
        REQUEST_CHECKOUT: 'PENDING_CHECKOUT',
        EXPIRE: 'EXPIRED',
    },
    PENDING_CHECKOUT: {
        COMPLETE_VALIDATION: 'COMPLETED',
        MARK_VALIDATION_FAILED: 'VALIDATION_FAILED',
        EXPIRE: 'EXPIRED',
    },
    COMPLETED: {
        EXPIRE: 'COMPLETED',
    },
    VALIDATION_FAILED: {},
    EXPIRED: {},
};
function nextStatus(current, event) {
    const next = TABLE[current]?.[event];
    if (!next) {
        throw new checkout_errors_1.InvalidTransitionError(`Cannot apply "${event}" from state "${current}"`);
    }
    return next;
}
//# sourceMappingURL=session-state-machine.js.map