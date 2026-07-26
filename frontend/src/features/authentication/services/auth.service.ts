import type { Profile, Session } from '@/entities/user';
import { parseOrThrow } from '@/shared/lib/errors';
import { authRepository } from '../repositories/auth.repository';
import { RegisterSchema, type RegisterInput } from '../schemas/register.schema';
import { LoginSchema, type LoginInput } from '../schemas/login.schema';
import {
  RequestPasswordResetSchema,
  type RequestPasswordResetInput,
} from '../schemas/requestPasswordReset.schema';
import { ResetPasswordSchema, type ResetPasswordInput } from '../schemas/resetPassword.schema';

export const authService = {
  async register(input: RegisterInput): Promise<{ user: Profile; session: Session }> {
    const parsed = parseOrThrow(RegisterSchema, input);
    return authRepository.register(parsed);
  },

  async login(input: LoginInput): Promise<{ user: Profile; session: Session }> {
    const parsed = parseOrThrow(LoginSchema, input);
    return authRepository.login(parsed);
  },

  async logout(): Promise<void> {
    return authRepository.logout();
  },

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<void> {
    const parsed = parseOrThrow(RequestPasswordResetSchema, input);
    return authRepository.requestPasswordReset(parsed.email);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const parsed = parseOrThrow(ResetPasswordSchema, input);
    return authRepository.resetPassword({ newPassword: parsed.newPassword });
  },
};
