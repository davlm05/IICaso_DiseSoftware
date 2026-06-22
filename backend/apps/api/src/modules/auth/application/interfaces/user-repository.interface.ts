import type { Role } from '@smartcart/shared-types';

/**
 * User persistence port (README §2.8 Workflow 3). Returns plain records — the
 * `passwordHash` never leaves the backend and is redacted from logs (§2.5 A02).
 */
export const USER_REPOSITORY = 'IUserRepository';

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: Role;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
  role: Role;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
}
