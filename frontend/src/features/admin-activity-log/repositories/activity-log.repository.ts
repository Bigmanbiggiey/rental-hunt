import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';

export interface ActivityLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogFilters {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ActivityLogListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ActivityLogListResult {
  data: ActivityLog[];
  meta: ActivityLogListMeta;
}

interface ActivityLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string } | null;
}

function mapRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor?.full_name ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

const ACTIVITY_LOG_COLUMNS =
  'id, actor_id, action, entity_type, entity_id, metadata, created_at, actor:profiles(full_name)';
const DEFAULT_PAGE_SIZE = 20;

// api-design.md §9's "Activity Logs" row — filterable by entityType/entityId/
// actorId/date range, single owner (no other feature reads activity_logs),
// so this repository stays feature-local per ADR-026/028's precedent.
export interface ActivityLogRepository {
  list(filters?: ActivityLogFilters, page?: number, pageSize?: number): Promise<ActivityLogListResult>;
  delete(id: string): Promise<void>;
}

export const activityLogRepository: ActivityLogRepository = {
  async list(filters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('activity_logs')
      .select(ACTIVITY_LOG_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters.actorId) query = query.eq('actor_id', filters.actorId);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    const { data, error, count } = await query.returns<ActivityLogRow[]>();
    if (error) throw mapSupabaseError(error);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async delete(id) {
    const { error } = await supabase.from('activity_logs').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};
