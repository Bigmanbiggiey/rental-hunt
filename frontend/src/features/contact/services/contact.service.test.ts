import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSubmit = vi.fn();
const mockCountRecentByEmail = vi.fn();

vi.mock('@/entities/contact-message', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/contact-message')>();
  return {
    ...actual,
    contactMessageRepository: {
      submit: mockSubmit,
      countRecentByEmail: mockCountRecentByEmail,
    },
  };
});

const { contactService } = await import('./contact.service');

const VALID_INPUT = {
  name: 'Jane Wanjiru',
  email: 'jane@example.test',
  message: 'Is this property still available for viewing next week?',
};

describe('contactService.submit() — rate limiting (api-design.md §18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with RATE_LIMITED at 5 recent submissions, without calling the Repository submit', async () => {
    mockCountRecentByEmail.mockResolvedValueOnce(5);

    await expect(contactService.submit(VALID_INPUT)).rejects.toMatchObject({ code: 'RATE_LIMITED' });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('allows submission at 4 recent submissions', async () => {
    mockCountRecentByEmail.mockResolvedValueOnce(4);
    mockSubmit.mockResolvedValueOnce({ id: 'm1' });

    await contactService.submit(VALID_INPUT);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid input with VALIDATION_ERROR when under the rate limit', async () => {
    mockCountRecentByEmail.mockResolvedValueOnce(0);

    await expect(contactService.submit({ ...VALID_INPUT, message: 'short' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('counts recent submissions by the lower-cased email, matching the schema normalization', async () => {
    mockCountRecentByEmail.mockResolvedValueOnce(0);
    mockSubmit.mockResolvedValueOnce({ id: 'm1' });

    await contactService.submit({ ...VALID_INPUT, email: 'Jane@Example.TEST' });

    expect(mockCountRecentByEmail).toHaveBeenCalledWith('jane@example.test', expect.any(String));
  });
});
