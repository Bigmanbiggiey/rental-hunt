import { useNavigate, useParams } from 'react-router';
import {
  ImageManager,
  PropertyForm,
  VerificationStatusPanel,
  useAgentProperty,
  useAgentPropertyVerificationRealtime,
} from '@/features/agent-properties';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';

// AGENT-002 (create, no :id param) and AGENT-003 (edit, :id param) — one
// page handles both, matching the Sprint 6 plan's Part G design.
function AgentPropertyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  useAgentPropertyVerificationRealtime();
  const { data: property, isLoading, isError } = useAgentProperty(id);

  if (isEditMode && isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isEditMode && (isError || !property)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>This property could not be found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-h1 text-foreground font-semibold">
        {isEditMode ? 'Edit listing' : 'New listing'}
      </h1>

      <PropertyForm
        property={property}
        onSuccess={(saved) => {
          // AGENT-005's image upload only makes sense once a property row
          // exists — a fresh create routes straight into its own edit page
          // so the agent can add images/submit for verification next.
          if (!isEditMode) {
            navigate(PATHS.authenticated.agentPropertyEdit.replace(':id', saved.id));
          }
        }}
      />

      {isEditMode && property && (
        <>
          <div className="border-border border-t pt-6">
            <h2 className="text-h2 text-foreground mb-3 font-semibold">Verification</h2>
            <VerificationStatusPanel property={property} />
          </div>

          <div className="border-border border-t pt-6">
            <h2 className="text-h2 text-foreground mb-3 font-semibold">Images</h2>
            <ImageManager propertyId={property.id} />
          </div>
        </>
      )}
    </div>
  );
}

export { AgentPropertyFormPage };
