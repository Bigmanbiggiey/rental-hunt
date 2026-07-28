import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';

// ui-guidelines.md §12.13 — Web Share API on supporting mobile browsers,
// clipboard fallback + a confirming Toast elsewhere.
export function ShareButton({ title, url }: { title: string; url: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // A user cancelling the native share sheet throws AbortError —
        // not a failure, so it's caught and silently ignored, never toasted.
        if (error instanceof Error && error.name === 'AbortError') return;
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard.');
  };

  return (
    <Button variant="outline" size="sm" onClick={() => void handleShare()}>
      <Share2 className="size-4" aria-hidden="true" />
      Share
    </Button>
  );
}
