import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { Agency, AgencyOnboardingStatus } from '@/entities/agency';
import { PATHS } from '@/shared/config';
import { useApproveAgencyApplication } from '../hooks/useApproveAgencyApplication';
import { useRejectAgencyApplication } from '../hooks/useRejectAgencyApplication';
import { RejectAgencyApplicationDialog } from './RejectAgencyApplicationDialog';

export interface AdminAgencyTableProps {
  agencies: Agency[];
  onEdit: (agency: Agency) => void;
}

function agencyDetailPath(slug: string): string {
  return PATHS.public.agencyDetail.replace(':slug', slug);
}

const ONBOARDING_BADGE: Record<AgencyOnboardingStatus, { variant: 'warning' | 'success' | 'destructive'; label: string } | null> = {
  pending_review: { variant: 'warning', label: 'Pending review' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  approved: null, // the existing Active/Inactive badge already covers the normal case
};

function ApplicationActions({ agency }: { agency: Agency }) {
  const { mutate: approve, isPending: isApproving } = useApproveAgencyApplication();
  const { mutate: reject, isPending: isRejecting } = useRejectAgencyApplication();
  const [rejectOpen, setRejectOpen] = useState(false);

  if (agency.onboardingStatus !== 'pending_review') return null;

  const onError = (error: unknown) => {
    toast.error(isAppError(error) ? error.message : 'Something went wrong.');
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        isLoading={isApproving}
        onClick={() => approve(agency.id, { onSuccess: () => toast.success('Agency approved.'), onError })}
      >
        Approve
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setRejectOpen(true)}>
        Reject
      </Button>
      <RejectAgencyApplicationDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isPending={isRejecting}
        onConfirm={(reason) =>
          reject(
            { id: agency.id, reason },
            {
              onSuccess: () => {
                toast.success('Application rejected.');
                setRejectOpen(false);
              },
              onError,
            },
          )
        }
      />
    </div>
  );
}

function StatusBadges({ agency }: { agency: Agency }) {
  const onboarding = ONBOARDING_BADGE[agency.onboardingStatus];
  return (
    <div className="flex flex-wrap gap-1">
      {onboarding && <Badge variant={onboarding.variant}>{onboarding.label}</Badge>}
      {agency.onboardingStatus === 'approved' && (
        <Badge variant={agency.isActive ? 'success' : 'outline'}>{agency.isActive ? 'Active' : 'Inactive'}</Badge>
      )}
    </div>
  );
}

/** ui-guidelines.md §13.2: a real Table on >= lg, a stacked Card list on < lg. */
export function AdminAgencyTable({ agencies, onEdit }: AdminAgencyTableProps) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">
                  <Link to={agencyDetailPath(agency.slug)} className="hover:underline">
                    {agency.name}
                  </Link>
                </TableCell>
                <TableCell>{agency.phone ?? '—'}</TableCell>
                <TableCell>{agency.email ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadges agency={agency} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <ApplicationActions agency={agency} />
                    <Button variant="ghost" size="sm" onClick={() => onEdit(agency)}>
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {agencies.map((agency) => (
          <li key={agency.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <Link to={agencyDetailPath(agency.slug)} className="font-medium hover:underline">
                    {agency.name}
                  </Link>
                  <p className="text-body-sm text-muted-foreground">{agency.phone ?? '—'}</p>
                  <div className="mt-1">
                    <StatusBadges agency={agency} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ApplicationActions agency={agency} />
                  <Button variant="ghost" size="sm" onClick={() => onEdit(agency)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
