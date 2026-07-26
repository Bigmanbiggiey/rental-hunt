import { z } from 'zod';

/**
 * Shared Profile field rules (api-design.md §5.1/§5.8/§14), reused by every
 * feature that reads or writes a Profile — extracted here per
 * coding-standards.md §3.2 rather than duplicated in each feature's own
 * schema.
 */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name.')
  .max(100, 'Full name must be 100 characters or fewer.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    'Enter a valid phone number in international format, e.g. +254712345678.',
  );

/**
 * Shared password rule (api-design.md §14), reused by every schema that
 * accepts a new password — extracted here on its third occurrence
 * (Register, Reset Password, Update Password) per coding-standards.md §7.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Za-z]/, 'Password must include a letter.')
  .regex(/[0-9]/, 'Password must include a number.');
