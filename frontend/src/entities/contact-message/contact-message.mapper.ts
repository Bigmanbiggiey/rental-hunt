import type { ContactMessage } from './contact-message.types';

/** Shape of a raw `public.contact_messages` row (database.md §5.16), snake_case as PostgREST returns it. */
export interface ContactMessageRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export function mapContactMessageRow(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    message: row.message,
    isResolved: row.is_resolved,
    createdAt: row.created_at,
  };
}
