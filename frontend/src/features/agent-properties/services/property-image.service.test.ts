import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpload = vi.fn();
const mockCountRecentByAgent = vi.fn();
const mockListByProperty = vi.fn();
const mockDelete = vi.fn();
const mockReorder = vi.fn();

vi.mock('@/entities/property', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/property')>();
  return {
    ...actual,
    propertyImageRepository: {
      upload: mockUpload,
      countRecentByAgent: mockCountRecentByAgent,
      listByProperty: mockListByProperty,
      delete: mockDelete,
      reorder: mockReorder,
    },
  };
});

const { propertyImageService } = await import('./property-image.service');

function makeFile(overrides: Partial<{ type: string; size: number }> = {}): File {
  const type = overrides.type ?? 'image/jpeg';
  const size = overrides.size ?? 1024;
  const file = new File([new Uint8Array(size)], 'photo.jpg', { type });
  return file;
}

describe('propertyImageService.upload() — rate limiting (api-design.md §18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with RATE_LIMITED at 20 recent uploads, without calling the Repository upload', async () => {
    mockCountRecentByAgent.mockResolvedValueOnce(20);

    await expect(propertyImageService.upload('p1', makeFile(), 'a1')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('allows upload at 19 recent uploads', async () => {
    mockCountRecentByAgent.mockResolvedValueOnce(19);
    mockUpload.mockResolvedValueOnce({ id: 'img1' });

    await propertyImageService.upload('p1', makeFile(), 'a1');

    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it('still rejects an invalid file type with VALIDATION_ERROR before checking the rate limit', async () => {
    await expect(
      propertyImageService.upload('p1', makeFile({ type: 'application/pdf' }), 'a1'),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    expect(mockCountRecentByAgent).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
