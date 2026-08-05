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
