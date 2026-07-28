import { Avatar, AvatarFallback, AvatarImage, Card } from '@/shared/ui';
import type { PropertyAgent } from './property.types';

// PROP-005 (ui-guidelines.md §12.7). Pulls only the public-safe
// `agent_directory` subset already embedded on `Property.agent` — never
// phone/email directly rendered. Agency name/logo aren't part of PROP-005's
// actual acceptance criteria (only "agent name and contact/profile info");
// not fetched here to avoid scope creep — a future ticket can extend
// `PROPERTY_COLUMNS`'s agent embed if agency branding is explicitly needed.
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
        {agent.jobTitle && <p className="text-body-sm text-muted-foreground">{agent.jobTitle}</p>}
        {agent.bio && <p className="text-body-sm text-muted-foreground">{agent.bio}</p>}
      </div>
    </Card>
  );
}
