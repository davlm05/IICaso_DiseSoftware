"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const domain_error_1 = require("../errors/domain-error");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('Exception');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'Internal server error';
        if (exception instanceof domain_error_1.DomainError) {
            status = exception.httpStatus;
            code = exception.code;
            message = exception.message;
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            code = common_1.HttpStatus[status] ?? 'ERROR';
            message = typeof body === 'string' ? body : body;
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        if (status >= 500) {
            this.logger.error(`${req.method} ${req.url} -> ${status}`, exception?.stack);
        }
        else {
            this.logger.warn(`${req.method} ${req.url} -> ${status} (${code})`);
        }
        res.status(status).json({
            statusCode: status,
            code,
            ...(typeof message === 'object' ? message : { message }),
            timestamp: new Date().toISOString(),
            path: req.url,
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map