/**
 * The single error shape that crosses the Repository boundary (api-design.md
 * §15, coding-standards.md §16). Native `Error`/Supabase errors never
 * propagate past a Repository unmapped — see `mapSupabaseError.ts`.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'RESET_TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'PROPERTY_NOT_FOUND'
  | 'AGENCY_NOT_FOUND'
  | 'VIEWING_REQUEST_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'IMAGE_NOT_FOUND'
  | 'AGENT_NOT_FOUND'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'USER_HAS_ACTIVITY'
  | 'CONFLICT'
  | 'PROPERTY_NOT_AVAILABLE'
  | 'INVALID_STATE_TRANSITION'
  | 'RATE_LIMITED'
  | 'STORAGE_ERROR'
  | 'DATABASE_ERROR'
  | 'UNEXPECTED_ERROR';

/** Field-path → message map, matching Zod's error shape (§15.1). */
export type ErrorDetails = Record<string, string>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details: ErrorDetails | null;

  constructor(code: ErrorCode, message: string, details: ErrorDetails | null = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
