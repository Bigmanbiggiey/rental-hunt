import { describe, expect, it, vi } from 'vitest';

// listByProperty's chain: select().eq().order().returns(). upload()'s
// max-display_order lookup shares the same select().eq().order() hops but
// ends on .limit().maybeSingle() instead — both endpoints are exposed on
// the same mockOrder return value.
const mockReturns = vi.fn();
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = vi.fn(() => ({ returns: mockReturns, limit: mockLimit }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

// upload()'s metadata insert: insert({...}).select(cols).single().
const mockInsertSingle = vi.fn();
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }));
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

// delete()'s chain: delete().eq('id', imageId).select('image_url').single().
const mockDeleteSingle = vi.fn();
const mockDeleteSelect = vi.fn(() => ({ single: mockDeleteSingle }));
const mockDeleteEq = vi.fn(() => ({ select: mockDeleteSelect }));
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

// reorder()'s chain: update({display_order}).eq('id', id).eq('property_id',
// propertyId) — the second .eq() call's return value IS the awaited result
// (Promise.all awaits the chain's own result, not a `.then()` after it).
// Explicit return type — otherwise TS locks the mock's resolved shape to
// its first mockResolvedValueOnce call site (`error: null` only), rejecting
// a later call that resolves a real Postgrest-error-shaped `error`.
interface UpdateResult {
  error: { code: string; message: string; details: string; hint: string } | null;
}
const mockReorderSecondEq = vi.fn<() => Promise<UpdateResult>>(() => Promise.resolve({ error: null }));
const mockReorderFirstEq = vi.fn(() => ({ eq: mockReorderSecondEq }));
const mockUpdate = vi.fn(() => ({ eq: mockReorderFirstEq }));

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

const mockStorageUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  upload: mockStorageUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockStorageRemove,
}));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, storage: { from: mockStorageFrom } },
}));

const { propertyImageRepository } = await import('./property-image.repository');

const ROW = {
  id: 'img-1',
  property_id: 'p1',
  image_url: 'http://127.0.0.1:54321/storage/v1/object/public/property-images/p1/abc-photo.jpg',
  alt_text: null,
  display_order: 0,
};

describe('propertyImageRepository.listByProperty (unit, fake Supabase client)', () => {
  it('maps rows ordered by display_order', async () => {
    mockReturns.mockResolvedValueOnce({ data: [ROW], error: null });

    const result = await propertyImageRepository.listByProperty('p1');

    expect(mockFrom).toHaveBeenCalledWith('property_images');
    expect(mockEq).toHaveBeenCalledWith('property_id', 'p1');
    expect(result).toEqual([
      { id: 'img-1', propertyId: 'p1', imageUrl: ROW.image_url, altText: null, displayOrder: 0 },
    ]);
  });

  it('normalizes a database error via the shared error mapper', async () => {
    mockReturns.mockResolvedValueOnce({
      data: null,
      error: { code: '57014', message: 'statement timeout', details: '', hint: '' },
    });

    await expect(propertyImageRepository.listByProperty('p1')).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    });
  });
});

describe('propertyImageRepository.upload (unit, fake Supabase client)', () => {
  it('uploads to Storage, resolves the next display_order, and inserts the metadata row', async () => {
    mockStorageUpload.mockResolvedValueOnce({ data: { path: 'ignored' }, error: null });
    mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: ROW.image_url } });
    mockMaybeSingle.mockResolvedValueOnce({ data: { display_order: 2 }, error: null });
    mockInsertSingle.mockResolvedValueOnce({ data: { ...ROW, display_order: 3 }, error: null });

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await propertyImageRepository.upload('p1', file);

    expect(mockStorageFrom).toHaveBeenCalledWith('property-images');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ property_id: 'p1', image_url: ROW.image_url, display_order: 3 }),
    );
    expect(result.displayOrder).toBe(3);
  });

  it('defaults display_order to 0 for a property with no existing images', async () => {
    mockStorageUpload.mockResolvedValueOnce({ data: { path: 'ignored' }, error: null });
    mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: ROW.image_url } });
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsertSingle.mockResolvedValueOnce({ data: ROW, error: null });

    await propertyImageRepository.upload('p1', new File(['x'], 'photo.jpg', { type: 'image/jpeg' }));

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ display_order: 0 }));
  });

  it('rolls back the just-uploaded Storage object when the metadata insert fails', async () => {
    mockStorageUpload.mockResolvedValueOnce({ data: { path: 'ignored' }, error: null });
    mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: ROW.image_url } });
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsertSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '23503', message: 'foreign key violation', details: '', hint: '' },
    });

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(propertyImageRepository.upload('p1', file)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(mockStorageRemove).toHaveBeenCalledTimes(1);
    const [removedPaths] = mockStorageRemove.mock.calls[0] as [string[]];
    expect(removedPaths[0]).toMatch(/^p1\//);
  });
});

describe('propertyImageRepository.delete (unit, fake Supabase client)', () => {
  it('deletes the row and best-effort removes the derived Storage path', async () => {
    mockDeleteSingle.mockResolvedValueOnce({ data: { image_url: ROW.image_url }, error: null });
    mockStorageRemove.mockResolvedValueOnce({ data: null, error: null });

    await propertyImageRepository.delete('img-1');

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'img-1');
    expect(mockStorageRemove).toHaveBeenCalledWith(['p1/abc-photo.jpg']);
  });

  it('normalizes a "no rows" error to IMAGE_NOT_FOUND', async () => {
    mockDeleteSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(propertyImageRepository.delete('missing')).rejects.toMatchObject({
      code: 'IMAGE_NOT_FOUND',
    });
  });
});

describe('propertyImageRepository.reorder (unit, fake Supabase client)', () => {
  it('writes one display_order update per id, then re-lists the property', async () => {
    mockReorderSecondEq.mockResolvedValue({ error: null });
    mockReturns.mockResolvedValueOnce({ data: [ROW], error: null });

    const result = await propertyImageRepository.reorder('p1', ['img-2', 'img-1']);

    expect(mockUpdate).toHaveBeenCalledWith({ display_order: 0 });
    expect(mockUpdate).toHaveBeenCalledWith({ display_order: 1 });
    expect(result).toHaveLength(1);
  });

  it('normalizes an error from any one of the updates', async () => {
    mockReorderSecondEq.mockResolvedValueOnce({ error: null });
    mockReorderSecondEq.mockResolvedValueOnce({
      error: { code: '42501', message: 'permission denied', details: '', hint: '' },
    });

    await expect(propertyImageRepository.reorder('p1', ['img-1', 'img-2'])).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
