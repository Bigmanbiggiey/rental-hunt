import { AppError, type ErrorCode } from './appError';

interface AuthErrorLike {
  status?: number;
  code?: string;
  message: string;
}

interface PostgrestErrorLike {
  code: string;
  message: string;
  details: string;
  hint: string;
}

function isAuthErrorLike(error: unknown): error is AuthErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('status' in error || 'code' in error) &&
    !('details' in error && 'hint' in error)
  );
}

function isPostgrestErrorLike(error: unknown): error is PostgrestErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error &&
    'hint' in error
  );
}

/** Supabase Auth error codes (`@supabase/auth-js`) mapped per api-design.md §15.3. */
const AUTH_ERROR_CODE_MAP: Partial<Record<string, ErrorCode>> = {
  invalid_credentials: 'INVALID_CREDENTIALS',
  email_exists: 'EMAIL_ALREADY_REGISTERED',
  user_already_exists: 'EMAIL_ALREADY_REGISTERED',
  weak_password: 'VALIDATION_ERROR',
  email_address_invalid: 'VALIDATION_ERROR',
  over_request_rate_limit: 'RATE_LIMITED',
  over_email_send_rate_limit: 'RATE_LIMITED',
  session_expired: 'SESSION_EXPIRED',
  refresh_token_not_found: 'SESSION_EXPIRED',
  refresh_token_already_used: 'SESSION_EXPIRED',
  session_not_found: 'UNAUTHENTICATED',
  user_not_found: 'UNAUTHENTICATED',
  otp_expired: 'RESET_TOKEN_EXPIRED',
};

/** Postgres/PostgREST error codes mapped per api-design.md §15.3. */
const POSTGREST_ERROR_CODE_MAP: Partial<Record<string, ErrorCode>> = {
  '23505': 'CONFLICT', // unique_violation
  '23503': 'VALIDATION_ERROR', // foreign_key_violation
  '23514': 'VALIDATION_ERROR', // check_violation
  '42501': 'FORBIDDEN', // insufficient_privilege (RLS rejection)
  PGRST116: 'FORBIDDEN', // 0 or >1 rows for .single() — most often an RLS-filtered miss
};

export interface MapSupabaseErrorOptions {
  /** Used when a PostgREST "no rows" result should map to a resource-specific 404 instead of the generic default. */
  notFoundCode?: ErrorCode;
}

/**
 * The single shared utility every Repository funnels errors through
 * (coding-standards.md §10, api-design.md §15.3) — never reimplemented
 * per-repository. Normalizes Supabase Auth errors, PostgREST/Postgres
 * errors, and anything else caught into a typed `AppError`.
 */
export function mapSupabaseError(error: unknown, options: MapSupabaseErrorOptions = {}): AppError {
  if (error instanceof AppError) return error;

  if (isPostgrestErrorLike(error)) {
    if (error.code === 'PGRST116' && options.notFoundCode) {
      return new AppError(options.notFoundCode, 'This item could not be found.');
    }
    const code = POSTGREST_ERROR_CODE_MAP[error.code] ?? 'DATABASE_ERROR';
    return new AppError(code, friendlyMessage(code), null);
  }

  if (isAuthErrorLike(error)) {
    const code: ErrorCode =
      (error.code ? AUTH_ERROR_CODE_MAP[error.code] : undefined) ?? 'INVALID_CREDENTIALS';
    return new AppError(code, friendlyMessage(code), null);
  }

  return new AppError('UNEXPECTED_ERROR', friendlyMessage('UNEXPECTED_ERROR'), null);
}

/** Plain-language messages per ui-guidelines.md §20's copywriting standard — never raw Postgres/Supabase text. */
function friendlyMessage(code: ErrorCode): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Some of the information provided isn’t valid. Please check and try again.';
    case 'UNAUTHENTICATED':
      return 'Please sign in to continue.';
    case 'INVALID_CREDENTIALS':
      return 'That email and password combination doesn’t match our records.';
    case 'SESSION_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    case 'RESET_TOKEN_EXPIRED':
      return 'This password reset link has expired. Please request a new one.';
    case 'FORBIDDEN':
      return 'You don’t have permission to do that.';
    case 'PROPERTY_NOT_FOUND':
      return 'This property could not be found. It may have been removed.';
    case 'AGENCY_NOT_FOUND':
      return 'This agency could not be found.';
    case 'VIEWING_REQUEST_NOT_FOUND':
      return 'This viewing request could not be found.';
    case 'PROFILE_NOT_FOUND':
      return 'This profile could not be found.';
    case 'IMAGE_NOT_FOUND':
      return 'This image could not be found.';
    case 'EMAIL_ALREADY_REGISTERED':
      return 'An account with this email already exists.';
    case 'CONFLICT':
      return 'This conflicts with an existing record.';
    case 'PROPERTY_NOT_AVAILABLE':
      return 'This property is no longer available for booking.';
    case 'INVALID_STATE_TRANSITION':
      return 'This action can’t be performed in the current state.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'STORAGE_ERROR':
      return 'We couldn’t process that file. Please try again.';
    case 'DATABASE_ERROR':
    case 'UNEXPECTED_ERROR':
    default:
      return 'Something went wrong on our end. Please try again.';
  }
}
