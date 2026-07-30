import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors/mapSupabaseError';
import type { UUID } from '@/entities/user';
import { mapAgentRow, type AgentRow } from './agent.mapper';
import type { Agent } from './agent.types';

export interface AgentRepository {
  /** Resolves the caller's own `agents` row from their `profiles.id` (mirrors `profileRepository.getById`'s composition). */
  getCurrentAgent(profileId: UUID): Promise<Agent>;
}

const AGENT_COLUMNS = 'id, profile_id, agency_id, job_title, bio, is_active, profile:profiles(full_name, avatar_url)';

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
};
