/**
 * Public barrel for @smartcart/shared-types.
 * Both the React Native app and backend/apps/api import from here so the
 * API contract has a single definition (README §2.2 Type-Safe Contract Sharing).
 */

// Validation (Zod schemas — runtime guards)
export * from './validation/auth.schemas';
export * from './validation/session.schemas';
export * from './validation/analytics.schemas';

// DTOs (compile-time types inferred from the schemas)
export * from './dto/auth.dto';
export * from './dto/session.dto';
export * from './dto/analytics.dto';
