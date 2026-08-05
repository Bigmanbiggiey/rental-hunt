import type { Agent } from './agent.types';

/** Shape of a `public.agents` row joined to `profiles(full_name, avatar_url)`, snake_case as PostgREST returns it. */
export interface AgentRow {
  id: string;
  profile_id: string;
  agency_id: string;
  job_title: string | null;
  bio: string | null;
  is_active: boolean;
  profile: { full_name: string; avatar_url: string | null } | null;
  agency: { name: string } | null;
}

export function mapAgentRow(row: AgentRow): Agent {
  return {
    id: row.id,
    profileId: row.profile_id,
    agencyId: row.agency_id,
    fullName: row.profile?.full_name ?? '',
    avatarUrl: row.profile?.avatar_url ?? null,
    jobTitle: row.job_title,
    bio: row.bio,
    isActive: row.is_active,
    agencyName: row.agency?.name ?? '',
  };
}
