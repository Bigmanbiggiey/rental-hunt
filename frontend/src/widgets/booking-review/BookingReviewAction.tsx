import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { ViewingRequest } from '@/entities/viewing-request';
import { useCreateReview, WriteReviewDialog } from '@/features/reviews';

/**
 * Epic 12's "Write a review" action for a completed booking — a widget, not
 * inline in `features/viewing-requests`, since it needs both
 * `entities/viewing-request` and `features/reviews`, and sibling features
 * can't cross-import each other (coding-standards.md §3.2). Passed into
 * `ViewingRequestList`'s `renderExtraActions` render-prop by the pages that
 * use it.
 */
export function BookingReviewAction({ viewingRequest }: { viewingRequest: ViewingRequest }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateReview();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Write a review
      </Button>
      <WriteReviewDialog
        open={open}
        onOpenChange={setOpen}
        isPending={isPending}
        onSubmit={(rating, comment) =>
          mutate(
            { viewingRequestId: viewingRequest.id, rating, comment: comment || undefined },
            {
              onSuccess: () => {
                toast.success('Thanks for your review!');
                setOpen(false);
              },
              onError: (error) => {
                toast.error(isAppError(error) ? error.message : 'Something went wrong. Please try again.');
              },
            },
          )
        }
      />
    </>
  );
}
