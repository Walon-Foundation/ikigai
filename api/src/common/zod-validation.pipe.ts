import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates a request body against a zod schema.
 *
 * zod rather than class-validator deliberately: the client already validates
 * with zod everywhere, and the DTO schemas here are meant to be importable by
 * client and mobile so a shape is stated once. Two validation libraries in one
 * server is a tax paid forever.
 *
 * The message shape matters. Server actions today throw plain Errors whose
 * message the UI renders inline, so a flat human-readable string keeps that
 * rendering working unchanged through the migration.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const [first] = result.error.issues;
      const path = first?.path.join('.');
      throw new BadRequestException(
        path ? `${path}: ${first.message}` : (first?.message ?? 'Invalid input'),
      );
    }
    return result.data;
  }
}
