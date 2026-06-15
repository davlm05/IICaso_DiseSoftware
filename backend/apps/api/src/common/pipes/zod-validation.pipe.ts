import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Generic Zod validation pipe (README §2.2 Type-Safe Contract Sharing).
 * Controllers apply it with a shared schema from `@smartcart/shared-types`,
 * e.g. `@Body(new ZodValidationPipe(LoginRequestSchema))`. Runtime guard at
 * the HTTP boundary so a bad payload can never reach the application layer.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
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
