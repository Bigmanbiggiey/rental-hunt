import { AppError, parseOrThrow } from '@/shared/lib/errors';
import { contactMessageRepository } from '@/entities/contact-message';
import { SubmitContactMessageSchema, type SubmitContactMessageInput } from '../schemas/submitContactMessage.schema';

const CONTACT_MESSAGE_RATE_LIMIT = 5;
const CONTACT_MESSAGE_RATE_WINDOW_SECONDS = 60 * 60;

export const contactService = {
  /**
   * api-design.md §18's Service-layer rate limit ("5 per hour, per email
   * address") — checked before Zod validation, the same "cheapest reason to
   * reject first" ordering `viewingRequestService.create()` already
   * established, since a spam attempt shouldn't get free validation-error
   * feedback either. Keyed by email (lower-cased, matching the schema's own
   * normalization) rather than a customer id, since a guest submitter has
   * none.
   */
  async submit(input: SubmitContactMessageInput) {
    const email = input.email.trim().toLowerCase();
    const windowStart = new Date(Date.now() - CONTACT_MESSAGE_RATE_WINDOW_SECONDS * 1000).toISOString();
    const recentCount = await contactMessageRepository.countRecentByEmail(email, windowStart);
    if (recentCount >= CONTACT_MESSAGE_RATE_LIMIT) {
      throw new AppError('RATE_LIMITED', 'Too many messages sent. Please try again later.', {
        retryAfterSeconds: String(CONTACT_MESSAGE_RATE_WINDOW_SECONDS),
      });
    }

    const parsed = parseOrThrow(SubmitContactMessageSchema, input);
    return contactMessageRepository.submit(parsed);
  },
};
