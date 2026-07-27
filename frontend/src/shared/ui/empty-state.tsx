import type { LucideIcon } from 'lucide-react';
import { Button } from './button';

// ui-guidelines.md §19 — the one shared anatomy every empty state uses
// (icon -> H4 -> body -> optional action). Hand-built rather than
// shadcn-generated, since this exact anatomy is project-specific. Justified
// as `shared/ui` now (not premature) since §19 already names five other
// concrete future consumers (favorites, bookings, agent listings, offline, 404).
export interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      <h4 className="text-h4 font-semibold text-foreground">{heading}</h4>
      <p className="max-w-sm text-body-sm text-muted-foreground">{description}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
