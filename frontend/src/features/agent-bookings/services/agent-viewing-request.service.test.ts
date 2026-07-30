import { describe, expect, it, vi } from 'vitest';
import type { ViewingRequest } from '@/entities/viewing-request';

const mockConfirm = vi.fn();
const mockReschedule = vi.fn();
const mockCancel = vi.fn();
const mockComplete = vi.fn();
const mockMarkNoShow = vi.fn();

vi.mock('@/entities/viewing-request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/viewing-request')>();
  return {
    ...actual,
    viewingRequestRepository: {
      confirm: mockConfirm,
      reschedule: mockReschedule,
      cancel: mockCancel,
      complete: mockComplete,
      markNoShow: mockMarkNoShow,
    },
  };
});

const { agentViewingRequestService } = await import('./agent-viewing-request.service');

function makeRequest(status: ViewingRequest['status']): ViewingRequest {
  return {
    id: 'vr1',
    customerId: 'c1',
    propertyId: 'p1',
    agentId: 'a1',
    requestedDate: '2099-01-01',
    requestedTime: '10:00',
    status,
    notes: null,
    cancellationReason: null,
    createdAt: '2026-07-29T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    property: { id: 'p1', slug: 'test', title: 'Test', images: [] },
    customer: null,
  };
}

describe('agentViewingRequestService (unit) — client-side pre-checks before the Repository call', () => {
  it('confirm() rejects a non-pending request without calling the Repository', async () => {
    await expect(agentViewingRequestService.confirm(makeRequest('confirmed'))).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('confirm() calls the Repository for a pending request', async () => {
    mockConfirm.mockResolvedValueOnce(makeRequest('confirmed'));
    await agentViewingRequestService.confirm(makeRequest('pending'));
    expect(mockConfirm).toHaveBeenCalledWith('vr1');
  });

  it('reschedule() rejects a completed request without calling the Repository', async () => {
    await expect(
      agentViewingRequestService.reschedule(makeRequest('completed'), {
        requestedDate: '2099-01-01',
        requestedTime: '10:00',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    expect(mockReschedule).not.toHaveBeenCalled();
  });

  it('reschedule() calls the Repository for a pending or confirmed request', async () => {
    mockReschedule.mockResolvedValueOnce(makeRequest('confirmed'));
    await agentViewingRequestService.reschedule(makeRequest('confirmed'), {
      requestedDate: '2099-01-01',
      requestedTime: '10:00',
    });
    expect(mockReschedule).toHaveBeenCalledWith('vr1', { requestedDate: '2099-01-01', requestedTime: '10:00' });
  });

  it('cancel() rejects an already-cancelled request without calling the Repository', async () => {
    await expect(agentViewingRequestService.cancel(makeRequest('cancelled'))).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('complete() rejects a pending request without calling the Repository', async () => {
    await expect(agentViewingRequestService.complete(makeRequest('pending'))).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('complete() calls the Repository for a confirmed request', async () => {
    mockComplete.mockResolvedValueOnce(makeRequest('completed'));
    await agentViewingRequestService.complete(makeRequest('confirmed'));
    expect(mockComplete).toHaveBeenCalledWith('vr1');
  });

  it('markNoShow() rejects a pending request without calling the Repository', async () => {
    await expect(agentViewingRequestService.markNoShow(makeRequest('pending'))).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockMarkNoShow).not.toHaveBeenCalled();
  });

  it('markNoShow() calls the Repository for a confirmed request', async () => {
    mockMarkNoShow.mockResolvedValueOnce(makeRequest('no_show'));
    await agentViewingRequestService.markNoShow(makeRequest('confirmed'));
    expect(mockMarkNoShow).toHaveBeenCalledWith('vr1');
  });
});
