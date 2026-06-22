import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Role } from '@smartcart/shared-types';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CreateUserInput,
  IUserRepository,
  UserRecord,
} from '../../application/interfaces/user-repository.interface';

/** Prisma-backed user repository (README §2.2 Rule 3). */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const row = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: input.email,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
        role: input.role,
      },
    });
    return this.toRecord(row);
  }

  private toRecord(row: {
    id: string;
    email: string;
    fullName: string;
    passwordHash: string;
    role: string;
  }): UserRecord {
    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      passwordHash: row.passwordHash,
      role: row.role as Role,
    };
  }
}
