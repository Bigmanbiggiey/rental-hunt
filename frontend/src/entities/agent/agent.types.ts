import type { UUID } from '@/entities/user';

/** api-design.md §3.1. */
export interface Agent {
  id: UUID;
  profileId: UUID;
  agencyId: UUID;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  bio: string | null;
  isActive: boolean;
  /** Added 2026-08-05 — `agentRepository`'s own join, not shared with `entities/property`'s `PropertyAgent.agencyName`. */
  agencyName: string;
}

/**
 * Epic 12's public Agency Profile Page "Agents" section — sourced from the
 * `agent_directory` security-definer view (database.md §9), the same public
 * projection `entities/property`'s `PropertyAgent` already reads for the
 * property detail page's Agent Card, but scoped by `agencyId` instead of
 * embedded off a single property. A distinct type rather than reusing
 * `PropertyAgent` — that one lives in `entities/property` and this
 * cross-cutting agency-page list belongs to `entities/agent`, not a
 * cross-entity import.
 */
export interface AgentDirectoryEntry {
  agentId: UUID;
  agencyId: UUID;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  bio: string | null;
  agencyName: string;
}
