import { describe, expect, it, vi } from 'vitest';

const mockReturns = vi.fn();
const mockEqAfterOrder = vi.fn(() => ({ returns: mockReturns }));
const mockOrder = vi.fn(() => ({ returns: mockReturns, eq: mockEqAfterOrder }));

const mockSelect = vi.fn(() => ({ order: mockOrder }));

const mockInsert = vi.fn();

const mockUpdateSingle = vi.fn();
const mockUpdateSelect = vi.fn(() => ({ single: mockUpdateSingle }));
const mockUpdateEq = vi.fn(() => ({ select: mockUpdateSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

const mockRpc = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

const { contactMessageRepository } = await import('./contact-message.repository');

const ROW = {
  id: 'message-1',
  user_id: null,
  name: 'Jane Wanjiru',
  email: 'jane@example.test',
  message: 'Is this property still available for viewing next week?',
  is_resolved: false,
  created_at: '2026-08-05T10:00:00.000Z',
};

describe('contactMessageRepository.submit (unit, fake Supabase client)', () => {
  // Deliberately does not chain `.select()` after `.insert()` — no role but
  // admin can read this table at all (database.md §5.16), so a submitter
  // reading back their own row would fail with `42501` (found via a real
  // failing RLS integration test, see `contact-message.rls.test.ts`).
  it('inserts without requesting a read-back of the created row', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    const result = await contactMessageRepository.submit({
      name: 'Jane Wanjiru',
      email: 'jane@example.test',
      message: 'Is this property still available for viewing next week?',
    });

    expect(mockFrom).toHaveBeenCalledWith('contact_messages');
    expect(mockInsert).toHaveBeenCalledWith({
      name: 'Jane Wanjiru',
      email: 'jane@example.test',
      message: 'Is this property still available for viewing next week?',
    });
    expect(result).toBeUndefined();
  });

  it('normalizes an insert error via mapSupabaseError', async () => {
    mockInsert.mockResolvedValueOnce({
      error: { code: '42501', message: 'permission denied', details: '', hint: '' },
    });

    await expect(
      contactMessageRepository.submit({ name: 'X', email: 'x@example.test', message: 'A message long enough.' }),
    ).rejects.toThrow();
  });
});

describe('contactMessageRepository.countRecentByEmail (unit, fake Supabase client)', () => {
  // Calls a `security definer` RPC, not a direct table SELECT — `anon` has
  // no SELECT grant on `contact_messages` at all, and a real integration
  // test found a plain `.select(..., { head: true })` returns a bare 401
  // for `anon` regardless of RLS. See `contact-message.repository.ts`.
  it('calls the RPC with the email and since-timestamp, returning the count', async () => {
    mockRpc.mockResolvedValueOnce({ data: 3, error: null });

    const result = await contactMessageRepository.countRecentByEmail(
      'jane@example.test',
      '2026-08-05T09:00:00.000Z',
    );

    expect(mockRpc).toHaveBeenCalledWith('count_recent_contact_messages_by_email', {
      p_email: 'jane@example.test',
      p_since: '2026-08-05T09:00:00.000Z',
    });
    expect(result).toBe(3);
  });

  it('defaults to 0 when the RPC returns null', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await contactMessageRepository.countRecentByEmail('jane@example.test', '2026-08-05T09:00:00.000Z');

    expect(result).toBe(0);
  });
});

describe('contactMessageRepository.list (unit, fake Supabase client)', () => {
  it('orders newest-first with no filter applied by default', async () => {
    mockReturns.mockResolvedValueOnce({ data: [ROW], error: null });

    const result = await contactMessageRepository.list();

    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockEqAfterOrder).not.toHaveBeenCalled();
    expect(result).toEqual([expect.objectContaining({ id: 'message-1' })]);
  });

  it('filters by isResolved when provided', async () => {
    mockReturns.mockResolvedValueOnce({ data: [], error: null });

    await contactMessageRepository.list({ isResolved: false });

    expect(mockEqAfterOrder).toHaveBeenCalledWith('is_resolved', false);
  });
});

describe('contactMessageRepository.setResolved (unit, fake Supabase client)', () => {
  it('patches is_resolved and returns the mapped row', async () => {
    mockUpdateSingle.mockResolvedValueOnce({ data: { ...ROW, is_resolved: true }, error: null });

    const result = await contactMessageRepository.setResolved('message-1', true);

    expect(mockUpdate).toHaveBeenCalledWith({ is_resolved: true });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'message-1');
    expect(result.isResolved).toBe(true);
  });
});

describe('contactMessageRepository.delete (unit, fake Supabase client)', () => {
  it('deletes by id', async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: null });

    await contactMessageRepository.delete('message-1');

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'message-1');
  });
});
