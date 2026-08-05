import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="focus-visible:ring-ring rounded-md p-0.5 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Star
            className={cn('size-6', star <= value ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

/** Epic 12 — a customer reviewing a completed viewing, off `BookingCard`'s own `actions` slot. */
export function WriteReviewDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => void;
  isPending?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setRating(0);
          setComment('');
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>Share your experience with this agency and agent.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>
            Rating <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <StarPicker value={rating} onChange={setRating} disabled={isPending} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">Comment (optional)</Label>
          <Textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            readOnly={isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button isLoading={isPending} disabled={rating === 0} onClick={() => onSubmit(rating, comment)}>
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
