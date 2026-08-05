import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors/mapSupabaseError';
import type { UUID } from '@/entities/user';
import { mapAgentDirectoryRow, mapAgentRow, type AgentDirectoryRow, type AgentRow } from './agent.mapper';
import type { Agent, AgentDirectoryEntry } from './agent.types';

export interface AgentRepository {
  /** Resolves the caller's own `agents` row from their `profiles.id` (mirrors `profileRepository.getById`'s composition). */
  getCurrentAgent(profileId: UUID): Promise<Agent>;
  /**
   * Epic 12's public Agency Profile Page "Agents" section — reads the
   * `agent_directory` security-definer view (database.md §9), not the raw
   * `agents` table: guests have no direct SELECT grant on `agents` at all
   * (Policy Summary: "SELECT (public directory fields via a view)"), so a
   * public listing has to go through the same view `entities/property`
   * already embeds for the Agent Card.
   */
  listByAgency(agencyId: UUID): Promise<AgentDirectoryEntry[]>;
}

// `agency:agencies(name)` added 2026-08-05 — the agent dashboard never
// showed which agency the signed-in agent belongs to (a separate gap from
// AgentCard's public-facing one, fixed via `agent_directory`'s own join).
const AGENT_COLUMNS =
  'id, profile_id, agency_id, job_title, bio, is_active, profile:profiles(full_name, avatar_url), agency:agencies(name)';

const AGENT_DIRECTORY_COLUMNS = 'agent_id, agency_id, full_name, avatar_url, job_title, bio, agency_name';

export const agentRepository: AgentRepository = {
  async getCurrentAgent(profileId) {
    const { data, error } = await supabase
      .from('agents')
      .select(AGENT_COLUMNS)
      .eq('profile_id', profileId)
      .single<AgentRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'AGENT_NOT_FOUND' });
    return mapAgentRow(data);
  },

  async listByAgency(agencyId) {
    const { data, error } = await supabase
      .from('agent_directory')
      .select(AGENT_DIRECTORY_COLUMNS)
      .eq('agency_id', agencyId)
      .order('full_name', { ascending: true })
      .returns<AgentDirectoryRow[]>();

    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapAgentDirectoryRow);
  },
};
