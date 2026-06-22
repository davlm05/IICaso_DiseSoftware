"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
class ZodValidationPipe {
    constructor(schema) {
        this.schema = schema;
    }
    transform(value) {
        try {
            return this.schema.parse(value);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                throw new common_1.BadRequestException({
                    message: 'Validation failed',
                    errors: err.issues.map((i) => ({
                        path: i.path.join('.'),
                        message: i.message,
                    })),
                });
            }
            throw err;
        }
    }
}
exports.ZodValidationPipe = ZodValidationPipe;
//# sourceMappingURL=zod-validation.pipe.js.map