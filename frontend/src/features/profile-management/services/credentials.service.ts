import { parseOrThrow } from '@/shared/lib/errors';
import { credentialsRepository } from '../repositories/credentials.repository';
import { UpdateEmailSchema, type UpdateEmailInput } from '../schemas/updateEmail.schema';
import { UpdatePasswordSchema, type UpdatePasswordInput } from '../schemas/updatePassword.schema';

export const credentialsService = {
  async getCurrentEmail(): Promise<string | null> {
    return credentialsRepository.getCurrentEmail();
  },

  async updateEmail(input: UpdateEmailInput): Promise<void> {
    const parsed = parseOrThrow(UpdateEmailSchema, input);
    return credentialsRepository.updateEmail(parsed.newEmail);
  },

  async updatePassword(input: UpdatePasswordInput): Promise<void> {
    const parsed = parseOrThrow(UpdatePasswordSchema, input);
    return credentialsRepository.updatePassword({
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });
  },

  async signOutOtherDevices(): Promise<void> {
    return credentialsRepository.signOutOtherDevices();
  },
};
