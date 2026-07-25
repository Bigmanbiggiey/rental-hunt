export type UUID = string;
export type ISODateTime = string; // ISO 8601, UTC

export type UserRole = 'customer' | 'agent' | 'moderator' | 'admin';

/** api-design.md §3.1. */
export interface Profile {
  id: UUID;
  role: UserRole;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  notificationPreferences: Record<string, boolean>;
  isActive: boolean;
  createdAt: ISODateTime;
}

/**
 * Not explicitly defined in api-design.md §3.1 — inferred from its §5.1 JSON
 * response example (`{ accessToken, refreshToken, expiresAt }`).
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateTime;
}
