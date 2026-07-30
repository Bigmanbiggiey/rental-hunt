import { useRef, useState, type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { usePropertyImages } from '../hooks/usePropertyImages';
import { useUploadPropertyImage } from '../hooks/useUploadPropertyImage';
import { useDeletePropertyImage } from '../hooks/useDeletePropertyImage';
import { useReorderPropertyImages } from '../hooks/useReorderPropertyImages';

export interface ImageManagerProps {
  propertyId: string;
}

/**
 * AGENT-005. Reordering is up/down arrow buttons, not drag-and-drop — no
 * DnD library is approved anywhere in the docs (Sprint 6 plan, Part E),
 * matching this project's consistent native-input-over-new-dependency choice.
 */
export function ImageManager({ propertyId }: ImageManagerProps) {
  const { data: images, isLoading } = usePropertyImages(propertyId);
  const uploadMutation = useUploadPropertyImage(propertyId);
  const deleteMutation = useDeletePropertyImage(propertyId);
  const reorderMutation = useReorderPropertyImages(propertyId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState('');

  const sorted = [...(images ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(
      { file, altText: altText || undefined },
      {
        onSuccess: () => {
          toast.success('Image uploaded.');
          setAltText('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (error) => {
          toast.error(isAppError(error) ? error.message : 'Upload failed.');
        },
      },
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const next = [...sorted];
    const current = next[index];
    const target = next[targetIndex];
    if (!current || !target) return;
    next[index] = target;
    next[targetIndex] = current;
    reorderMutation.mutate(next.map((image) => image.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="image-alt-text">Alt text (optional)</Label>
          <Input
            id="image-alt-text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Describe this photo"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          isLoading={uploadMutation.isPending}
        >
          <Upload aria-hidden="true" />
          Upload image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {isLoading && <p className="text-body-sm text-muted-foreground">Loading images…</p>}

      {!isLoading && sorted.length === 0 && (
        <p className="text-body-sm text-muted-foreground">No images uploaded yet.</p>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((image, index) => (
          <li key={image.id} className="space-y-2">
            <img
              src={image.imageUrl}
              alt={image.altText ?? ''}
              className="aspect-square w-full rounded-md object-cover"
              loading="lazy"
            />
            <div className="flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Move earlier"
                  disabled={index === 0 || reorderMutation.isPending}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Move later"
                  disabled={index === sorted.length - 1 || reorderMutation.isPending}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete image"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(image.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
