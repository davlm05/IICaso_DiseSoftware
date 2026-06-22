/**
 * Public barrel for @smartcart/shared-types.
 * Both the React Native app and backend/apps/api import from here so the
 * API contract has a single definition (README §2.2 Type-Safe Contract Sharing).
 */
export * from './validation/auth.schemas';
export * from './validation/session.schemas';
export * from './validation/analytics.schemas';
export * from './dto/auth.dto';
export * from './dto/session.dto';
export * from './dto/analytics.dto';
export * from './events/checkout.events';
