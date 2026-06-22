"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionNotFoundError = exports.UnknownStrategyError = exports.InvalidQrTokenError = exports.QrTokenExpiredError = exports.QrItemMismatchError = exports.EmptySessionError = exports.InvalidTransitionError = void 0;
const domain_error_1 = require("../../../../common/errors/domain-error");
class InvalidTransitionError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.httpStatus = 409;
        this.code = 'INVALID_SESSION_TRANSITION';
    }
}
exports.InvalidTransitionError = InvalidTransitionError;
class EmptySessionError extends domain_error_1.DomainError {
    constructor() {
        super('Cannot generate a checkout QR for a session with no items');
        this.httpStatus = 422;
        this.code = 'EMPTY_SESSION';
    }
}
exports.EmptySessionError = EmptySessionError;
class QrItemMismatchError extends domain_error_1.DomainError {
    constructor() {
        super('Scanned items do not match the items in the QR token');
        this.httpStatus = 409;
        this.code = 'QR_ITEM_MISMATCH';
    }
}
exports.QrItemMismatchError = QrItemMismatchError;
class QrTokenExpiredError extends domain_error_1.DomainError {
    constructor() {
        super('QR token has expired');
        this.httpStatus = 410;
        this.code = 'QR_TOKEN_EXPIRED';
    }
}
exports.QrTokenExpiredError = QrTokenExpiredError;
class InvalidQrTokenError extends domain_error_1.DomainError {
    constructor() {
        super('QR token is invalid');
        this.httpStatus = 400;
        this.code = 'INVALID_QR_TOKEN';
    }
}
exports.InvalidQrTokenError = InvalidQrTokenError;
class UnknownStrategyError extends domain_error_1.DomainError {
    constructor(type) {
        super(`No points strategy registered for type "${type}"`);
        this.httpStatus = 500;
        this.code = 'UNKNOWN_POINTS_STRATEGY';
    }
}
exports.UnknownStrategyError = UnknownStrategyError;
class SessionNotFoundError extends domain_error_1.DomainError {
    constructor() {
        super('Shopping session not found');
        this.httpStatus = 404;
        this.code = 'SESSION_NOT_FOUND';
    }
}
exports.SessionNotFoundError = SessionNotFoundError;
//# sourceMappingURL=checkout.errors.js.map