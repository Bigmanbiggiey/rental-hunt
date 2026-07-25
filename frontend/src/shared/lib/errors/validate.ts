import type { z } from 'zod';
import { AppError, type ErrorDetails } from './appError';

/**
 * Every Service's public entry point runs its Zod schema first
 * (coding-standards.md §11) — this is the one place a `ZodError` is caught
 * and normalized into the project's single `AppError` shape, so callers
 * never have to distinguish "Zod threw" from "the Repository threw"
 * (api-design.md §15.1's `details` field mirrors Zod's own field-path shape).
 */
export function parseOrThrow<Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const details: ErrorDetails = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!(path in details)) details[path] = issue.message;
  }
  throw new AppError('VALIDATION_ERROR', 'Some of the information provided isn’t valid.', details);
}
