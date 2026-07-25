import type { Profile, Session } from '@/entities/user';
import { parseOrThrow } from '@/shared/lib/errors';
import { authRepository } from '../repositories/auth.repository';
import { RegisterSchema, type RegisterInput } from '../schemas/register.schema';
import { LoginSchema, type LoginInput } from '../schemas/login.schema';

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

  async requestPasswordReset(email: string): Promise<void> {
    return authRepository.requestPasswordReset(email);
  },
};
