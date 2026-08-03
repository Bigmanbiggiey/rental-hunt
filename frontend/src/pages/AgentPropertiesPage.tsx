import { useState } from 'react';
import { Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  AgentPropertyTable,
  PropertyFilters,
  useAgentProperties,
  useAgentPropertyVerificationRealtime,
} from '@/features/agent-properties';
import type { AgentPropertyFilters } from '@/entities/property';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';

const PAGE_SIZE = 20;

// AGENT-001/002/003/004/006.
function AgentPropertiesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AgentPropertyFilters>({});
  const [page, setPage] = useState(1);

  useAgentPropertyVerificationRealtime();
  const { data, isLoading, isError } = useAgentProperties(filters, page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1 text-foreground font-semibold">Properties</h1>
        <Button onClick={() => navigate(PATHS.agentDashboard.propertyNew)}>
          <Plus aria-hidden="true" />
          New listing
        </Button>
      </div>

      <PropertyFilters
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading your properties.</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && data && data.data.length === 0 && (
        <EmptyState
          icon={Home}
          heading="No properties yet"
          description="Create your first listing to get started."
        />
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <AgentPropertyTable
            properties={data.data}
            onEdit={(propertyId) =>
              navigate(PATHS.agentDashboard.propertyEdit.replace(':id', propertyId))
            }
          />

          {data.meta.totalPages > 1 && (
            <div className="mx-auto flex items-center gap-4">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-body-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { AgentPropertiesPage };
