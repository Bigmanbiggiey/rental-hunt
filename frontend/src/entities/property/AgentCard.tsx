import { Avatar, AvatarFallback, AvatarImage, Card } from '@/shared/ui';
import type { PropertyAgent } from './property.types';

// PROP-005 (ui-guidelines.md §12.7). Pulls only the public-safe
// `agent_directory` subset already embedded on `Property.agent` — never
// phone/email directly rendered. Agency name added 2026-08-05 — `PROP-005`'s
// original acceptance criteria didn't call for it, but the developer asked
// for it directly; `agent_directory` now joins `agencies` for exactly this
// (see the migration for why that's not a new data-exposure concern).
export function AgentCard({ agent }: { agent: PropertyAgent }) {
  const hasName = agent.fullName.length > 0;

  return (
    <Card className="flex items-center gap-4 p-4">
      <Avatar className="size-14">
        {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.fullName} />}
        <AvatarFallback>{hasName ? agent.fullName.charAt(0).toUpperCase() : '?'}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-foreground">{hasName ? agent.fullName : 'Agent information unavailable'}</p>
        {agent.agencyName && <p className="text-body-sm text-primary font-medium">{agent.agencyName}</p>}
        {agent.jobTitle && <p className="text-body-sm text-muted-foreground">{agent.jobTitle}</p>}
        {agent.bio && <p className="text-body-sm text-muted-foreground">{agent.bio}</p>}
      </div>
    </Card>
  );
}
