import { AppError, parseOrThrow } from '@/shared/lib/errors';
import {
  viewingRequestRepository,
  type ListViewingRequestsInput,
  type ViewingRequest,
} from '@/entities/viewing-request';
import {
  RescheduleViewingRequestSchema,
  type RescheduleViewingRequestInput,
} from '../schemas/rescheduleViewingRequest.schema';
import { CancelViewingRequestAgentSchema } from '../schemas/cancelViewingRequestAgent.schema';

const CANCELLABLE_FROM: ViewingRequest['status'][] = ['pending', 'confirmed'];

/**
 * Each method pre-checks the already-loaded `ViewingRequest`'s status
 * against api-design.md §8.1 before calling the Repository — mirrors
 * `viewingRequestService.create()`'s "check first for good UX" precedent,
 * throwing a fast, specific `INVALID_STATE_TRANSITION` client-side rather
 * than waiting on a round trip. The Repository's own `.eq('status', ...)`
 * guards (entities/viewing-request) remain the real backstop for a race
 * (two tabs, double-click) — this is UX only, not the security boundary.
 */
export const agentViewingRequestService = {
  async listForAgent(input?: ListViewingRequestsInput) {
    return viewingRequestRepository.listForAgent(input);
  },

  async confirm(viewingRequest: ViewingRequest) {
    if (viewingRequest.status !== 'pending') {
      throw new AppError('INVALID_STATE_TRANSITION', 'This viewing can no longer be confirmed.');
    }
    return viewingRequestRepository.confirm(viewingRequest.id);
  },

  async reschedule(viewingRequest: ViewingRequest, input: RescheduleViewingRequestInput) {
    if (!CANCELLABLE_FROM.includes(viewingRequest.status)) {
      throw new AppError('INVALID_STATE_TRANSITION', 'This viewing can no longer be rescheduled.');
    }
    const parsed = parseOrThrow(RescheduleViewingRequestSchema, input);
    return viewingRequestRepository.reschedule(viewingRequest.id, parsed);
  },

  async cancel(viewingRequest: ViewingRequest, reason?: string) {
    if (!CANCELLABLE_FROM.includes(viewingRequest.status)) {
      throw new AppError('INVALID_STATE_TRANSITION', 'This viewing can no longer be cancelled.');
    }
    const parsed = parseOrThrow(CancelViewingRequestAgentSchema, { reason });
    return viewingRequestRepository.cancel(viewingRequest.id, parsed.reason);
  },

  async complete(viewingRequest: ViewingRequest) {
    if (viewingRequest.status !== 'confirmed') {
      throw new AppError('INVALID_STATE_TRANSITION', 'Only a confirmed viewing can be marked completed.');
    }
    return viewingRequestRepository.complete(viewingRequest.id);
  },

  async markNoShow(viewingRequest: ViewingRequest) {
    if (viewingRequest.status !== 'confirmed') {
      throw new AppError('INVALID_STATE_TRANSITION', 'Only a confirmed viewing can be marked no-show.');
    }
    return viewingRequestRepository.markNoShow(viewingRequest.id);
  },
};
