import { describe, expect, it } from 'vitest';
import { AppError } from './appError';
import { mapSupabaseError } from './mapSupabaseError';

describe('mapSupabaseError', () => {
  it('passes an existing AppError through unchanged', () => {
    const original = new AppError('FORBIDDEN', 'nope');
    expect(mapSupabaseError(original)).toBe(original);
  });

  it('maps a PostgREST unique_violation (23505) to CONFLICT', () => {
    const result = mapSupabaseError({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
      details: 'Key (slug)=(x) already exists.',
      hint: '',
    });
    expect(result.code).toBe('CONFLICT');
  });

  it('maps a PostgREST foreign_key_violation (23503) to VALIDATION_ERROR', () => {
    const result = mapSupabaseError({
      code: '23503',
      message: 'insert or update on table violates foreign key constraint',
      details: '',
      hint: '',
    });
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('maps an RLS permission-denied error (42501) to FORBIDDEN', () => {
    const result = mapSupabaseError({
      code: '42501',
      message: 'permission denied for table profiles',
      details: '',
      hint: 'Grant the required privileges to the current role with: GRANT SELECT ON public.profiles TO authenticated;',
    });
    expect(result.code).toBe('FORBIDDEN');
  });

  it('maps PGRST116 (no rows for .single()) to a supplied notFoundCode', () => {
    const result = mapSupabaseError(
      {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: '',
        hint: '',
      },
      { notFoundCode: 'PROFILE_NOT_FOUND' },
    );
    expect(result.code).toBe('PROFILE_NOT_FOUND');
  });

  it('maps an unrecognized Postgres code to DATABASE_ERROR', () => {
    const result = mapSupabaseError({
      code: '99999',
      message: 'something else',
      details: '',
      hint: '',
    });
    expect(result.code).toBe('DATABASE_ERROR');
  });

  it('maps a Supabase Auth invalid_credentials error to INVALID_CREDENTIALS', () => {
    const result = mapSupabaseError({
      code: 'invalid_credentials',
      status: 400,
      message: 'Invalid login credentials',
    });
    expect(result.code).toBe('INVALID_CREDENTIALS');
  });

  it('maps a Supabase Auth email_exists error to EMAIL_ALREADY_REGISTERED', () => {
    const result = mapSupabaseError({
      code: 'email_exists',
      status: 422,
      message: 'User already registered',
    });
    expect(result.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('maps a Supabase Auth weak_password error to VALIDATION_ERROR', () => {
    const result = mapSupabaseError({
      code: 'weak_password',
      status: 422,
      message: 'Password is too weak',
    });
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('maps a Supabase Auth over_request_rate_limit error to RATE_LIMITED', () => {
    const result = mapSupabaseError({
      code: 'over_request_rate_limit',
      status: 429,
      message: 'Too many requests',
    });
    expect(result.code).toBe('RATE_LIMITED');
  });

  it('falls back to INVALID_CREDENTIALS for an auth-shaped error with an unmapped code', () => {
    const result = mapSupabaseError({ code: 'something_unmapped', status: 400, message: 'oops' });
    expect(result.code).toBe('INVALID_CREDENTIALS');
  });

  it('maps anything unrecognized to UNEXPECTED_ERROR', () => {
    expect(mapSupabaseError(new Error('network down')).code).toBe('UNEXPECTED_ERROR');
    expect(mapSupabaseError('a plain string').code).toBe('UNEXPECTED_ERROR');
    expect(mapSupabaseError(null).code).toBe('UNEXPECTED_ERROR');
  });

  it('never surfaces raw Postgres/Supabase error text in the friendly message', () => {
    const result = mapSupabaseError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "profiles_pkey"',
      details: 'Key (id)=(...) already exists.',
      hint: '',
    });
    expect(result.message).not.toContain('constraint');
    expect(result.message).not.toContain('profiles_pkey');
  });
});
