import { AgencyRegistrationForm, useMyAgencyApplication } from '@/features/agency-registration';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';

/** Epic 12 — a customer applying to self-register their own agency. */
function AgencyRegisterPage() {
  const { data: application, isLoading, isError } = useMyAgencyApplication();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-h1 text-foreground font-semibold">Register your agency</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading your application status.</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && application && application.onboardingStatus === 'pending_review' && (
        <Alert>
          <AlertDescription>
            Your application for <strong>{application.name}</strong> is pending review. We'll let you know once an
            admin has made a decision.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && application && application.onboardingStatus === 'approved' && (
        <Alert>
          <AlertDescription>
            Your application for <strong>{application.name}</strong> has been approved — you now have agent access.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && application && application.onboardingStatus === 'rejected' && (
        <Alert variant="destructive">
          <AlertDescription>
            Your application for <strong>{application.name}</strong> was not approved
            {application.rejectionReason ? `: ${application.rejectionReason}` : '.'}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && !application && <AgencyRegistrationForm />}
    </div>
  );
}

export { AgencyRegisterPage };
