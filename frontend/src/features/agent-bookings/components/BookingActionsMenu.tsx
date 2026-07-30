import { MoreHorizontal } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui';
import type { ViewingRequest } from '@/entities/viewing-request';

export interface BookingActionsMenuProps {
  viewingRequest: ViewingRequest;
  onConfirm: () => void;
  onReschedule: () => void;
  onComplete: () => void;
  onMarkNoShow: () => void;
  onCancel: () => void;
}

/** ui-guidelines.md §13.2: row-level actions live in a trailing Dropdown Menu, not inline icon clutter (BOOK-002–006). */
export function BookingActionsMenu({
  viewingRequest,
  onConfirm,
  onReschedule,
  onComplete,
  onMarkNoShow,
  onCancel,
}: BookingActionsMenuProps) {
  const { status } = viewingRequest;
  const canConfirm = status === 'pending';
  const canReschedule = status === 'pending' || status === 'confirmed';
  const canComplete = status === 'confirmed';
  const canMarkNoShow = status === 'confirmed';
  const canCancel = status === 'pending' || status === 'confirmed';

  if (!canConfirm && !canReschedule && !canComplete && !canMarkNoShow && !canCancel) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Booking actions">
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canConfirm && <DropdownMenuItem onSelect={onConfirm}>Confirm</DropdownMenuItem>}
        {canReschedule && <DropdownMenuItem onSelect={onReschedule}>Reschedule</DropdownMenuItem>}
        {canComplete && <DropdownMenuItem onSelect={onComplete}>Mark completed</DropdownMenuItem>}
        {canMarkNoShow && <DropdownMenuItem onSelect={onMarkNoShow}>Mark no-show</DropdownMenuItem>}
        {canCancel && (
          <DropdownMenuItem onSelect={onCancel} className="text-destructive">
            Cancel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
