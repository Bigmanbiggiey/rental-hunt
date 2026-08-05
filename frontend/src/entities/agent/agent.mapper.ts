import type { Agent, AgentDirectoryEntry } from './agent.types';

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

/** Shape of a `public.agent_directory` row (database.md §9), snake_case as PostgREST returns it. */
export interface AgentDirectoryRow {
  agent_id: string;
  agency_id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  bio: string | null;
  agency_name: string;
}

export function mapAgentDirectoryRow(row: AgentDirectoryRow): AgentDirectoryEntry {
  return {
    agentId: row.agent_id,
    agencyId: row.agency_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    jobTitle: row.job_title,
    bio: row.bio,
    agencyName: row.agency_name,
  };
}
