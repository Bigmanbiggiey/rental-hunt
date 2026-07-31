import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { VerificationBadge, type Property } from '@/entities/property';
import { useVerificationHistory } from '@/entities/property-verification';
import { useSubmitForVerification } from '../hooks/useSubmitForVerification';

export interface VerificationStatusPanelProps {
  property: Property;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * AGENT-007's agent-facing half, plus (Sprint 7) the review history that
 * `property_verifications` now backs — this is what actually delivers
 * roadmap.md §11's DoD line "the agent sees... the reason" (a rejection's
 * reason) in the agent's own UI, not just the moderator's review screen.
 */
export function VerificationStatusPanel({ property }: VerificationStatusPanelProps) {
  const { mutate, isPending, error } = useSubmitForVerification();
  const { data: history } = useVerificationHistory(property.id);
  const canSubmit = property.verificationStatus === 'unverified' || property.verificationStatus === 'rejected';
  const submissionError = isAppError(error) ? error.message : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-body-sm text-muted-foreground">Verification status:</span>
        <VerificationBadge status={property.verificationStatus} />
      </div>
      {submissionError && <p className="text-body-sm text-destructive">{submissionError}</p>}
      {canSubmit && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          isLoading={isPending}
          onClick={() =>
            mutate(property.id, {
              onSuccess: () => toast.success('Submitted for verification.'),
            })
          }
        >
          Submit for Review
        </Button>
      )}

      {history && history.length > 0 && (
        <ul className="border-border mt-2 flex flex-col gap-2 border-t pt-2">
          {history.map((entry) => (
            <li key={entry.id} className="text-body-sm text-muted-foreground">
              <span className="text-foreground font-medium">{formatDate(entry.createdAt)}</span>
              {' — '}
              {entry.previousStatus ? `${entry.previousStatus} → ` : ''}
              {entry.newStatus}
              {entry.reason && <span className="block">Reason: {entry.reason}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
