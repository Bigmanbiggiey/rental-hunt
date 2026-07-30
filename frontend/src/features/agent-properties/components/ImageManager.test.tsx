import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropertyImage } from '@/entities/property';
import { ImageManager } from './ImageManager';

const mockUploadMutate = vi.fn();
vi.mock('../hooks/useUploadPropertyImage', () => ({
  useUploadPropertyImage: () => ({ mutate: mockUploadMutate, isPending: false }),
}));

const mockDeleteMutate = vi.fn();
vi.mock('../hooks/useDeletePropertyImage', () => ({
  useDeletePropertyImage: () => ({ mutate: mockDeleteMutate, isPending: false }),
}));

const mockReorderMutate = vi.fn();
vi.mock('../hooks/useReorderPropertyImages', () => ({
  useReorderPropertyImages: () => ({ mutate: mockReorderMutate, isPending: false }),
}));

let mockImages: PropertyImage[] = [];
let mockIsLoading = false;
vi.mock('../hooks/usePropertyImages', () => ({
  usePropertyImages: () => ({ data: mockImages, isLoading: mockIsLoading }),
}));

const IMAGES: PropertyImage[] = [
  { id: 'img1', propertyId: 'p1', imageUrl: 'https://example.com/1.jpg', altText: 'Living room', displayOrder: 0 },
  { id: 'img2', propertyId: 'p1', imageUrl: 'https://example.com/2.jpg', altText: 'Bedroom', displayOrder: 1 },
  { id: 'img3', propertyId: 'p1', imageUrl: 'https://example.com/3.jpg', altText: 'Kitchen', displayOrder: 2 },
];

describe('ImageManager (component)', () => {
  it('shows a loading message while images are loading', () => {
    mockIsLoading = true;
    mockImages = [];
    render(<ImageManager propertyId="p1" />);
    expect(screen.getByText(/loading images/i)).toBeInTheDocument();
    mockIsLoading = false;
  });

  it('shows an empty message when the property has no images yet', () => {
    mockImages = [];
    render(<ImageManager propertyId="p1" />);
    expect(screen.getByText(/no images uploaded yet/i)).toBeInTheDocument();
  });

  it('renders every image sorted by display order', () => {
    mockImages = [IMAGES[2]!, IMAGES[0]!, IMAGES[1]!]; // deliberately out of order
    render(<ImageManager propertyId="p1" />);

    const renderedImages = screen.getAllByRole('img');
    expect(renderedImages.map((img) => img.getAttribute('alt'))).toEqual([
      'Living room',
      'Bedroom',
      'Kitchen',
    ]);
  });

  it('uploads the selected file via the upload mutation', async () => {
    mockImages = IMAGES;
    render(<ImageManager propertyId="p1" />);

    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const user = userEvent.setup();
    await user.upload(fileInput, file);

    expect(mockUploadMutate).toHaveBeenCalledWith(
      { file, altText: undefined },
      expect.anything(),
    );
  });

  it('deletes an image via the delete mutation', async () => {
    mockImages = IMAGES;
    const user = userEvent.setup();
    render(<ImageManager propertyId="p1" />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete image/i });
    await user.click(deleteButtons[0]!);

    expect(mockDeleteMutate).toHaveBeenCalledWith('img1');
  });

  it('swaps an image earlier via the reorder mutation, disabling the up-arrow for the first image', async () => {
    mockImages = IMAGES;
    const user = userEvent.setup();
    render(<ImageManager propertyId="p1" />);

    const moveEarlierButtons = screen.getAllByRole('button', { name: /move earlier/i });
    expect(moveEarlierButtons[0]).toBeDisabled();

    await user.click(moveEarlierButtons[1]!);

    expect(mockReorderMutate).toHaveBeenCalledWith(['img2', 'img1', 'img3']);
  });

  it('disables the down-arrow for the last image', () => {
    mockImages = IMAGES;
    render(<ImageManager propertyId="p1" />);

    const moveLaterButtons = screen.getAllByRole('button', { name: /move later/i });
    expect(moveLaterButtons[moveLaterButtons.length - 1]).toBeDisabled();
  });
});
