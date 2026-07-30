import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { VerificationBadge, type Property } from '@/entities/property';
import { useSubmitForVerification } from '../hooks/useSubmitForVerification';

export interface VerificationStatusPanelProps {
  property: Property;
}

/**
 * AGENT-007's agent-facing half. Current status only, no history timeline —
 * `property_verifications` doesn't exist until Sprint 7 (Sprint 6 plan,
 * Gap 2's scope correction), so there is no history to show yet.
 */
export function VerificationStatusPanel({ property }: VerificationStatusPanelProps) {
  const { mutate, isPending, error } = useSubmitForVerification();
  const canSubmit = property.verificationStatus === 'unverified' || property.verificationStatus === 'rejected';
  const submissionError = isAppError(error) ? error.message : null;

  return (
    <div className="flex flex-col gap-2">
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
    </div>
  );
}
