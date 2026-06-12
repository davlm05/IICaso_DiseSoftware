import { z } from 'zod';
import {
  PointsConfigSchema,
  ProductDTOSchema,
  SessionItemDTOSchema,
  SessionDTOSchema,
  SessionStatusSchema,
  CreateSessionRequestSchema,
  AddItemRequestSchema,
  ValidateSessionRequestSchema,
  QrTicketResponseSchema,
} from '../validation/session.schemas';

/**
 * Session-domain DTOs. Inferred from the Zod schemas so the compile-time interface
 * and the runtime guard are one definition (README §2.4 Data Contracts).
 */

export type PointsConfig = z.infer<typeof PointsConfigSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type ProductDTO = z.infer<typeof ProductDTOSchema>;
export type SessionItemDTO = z.infer<typeof SessionItemDTOSchema>;
export type SessionDTO = z.infer<typeof SessionDTOSchema>;

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type AddItemRequest = z.infer<typeof AddItemRequestSchema>;
export type ValidateSessionRequest = z.infer<typeof ValidateSessionRequestSchema>;
export type QrTicketResponse = z.infer<typeof QrTicketResponseSchema>;
