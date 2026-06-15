import { SetMetadata } from '@nestjs/common';
import type { ApiKeyType } from '@prisma/client';

export const API_KEY_TYPE = 'apiKeyType';

/**
 * `@RequireApiKey('POS')` — marks a route as non-JWT, API-key authenticated
 * (README §2.4: POS validate uses a POS API Key; analytics uses B2B).
 */
export const RequireApiKey = (type: ApiKeyType) =>
  SetMetadata(API_KEY_TYPE, type);
