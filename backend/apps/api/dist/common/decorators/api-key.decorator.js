"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireApiKey = exports.API_KEY_TYPE = void 0;
const common_1 = require("@nestjs/common");
exports.API_KEY_TYPE = 'apiKeyType';
const RequireApiKey = (type) => (0, common_1.SetMetadata)(exports.API_KEY_TYPE, type);
exports.RequireApiKey = RequireApiKey;
//# sourceMappingURL=api-key.decorator.js.map