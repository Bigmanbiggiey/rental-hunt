import type { ISODateTime, UUID } from '@/entities/user';

/** api-design.md §23; database.md §5.16. */
export interface ContactMessage {
  id: UUID;
  userId: UUID | null;
  name: string;
  email: string;
  message: string;
  isResolved: boolean;
  createdAt: ISODateTime;
}

/** api-design.md §23.1's request shape — `userId` is never client-supplied. */
export interface SubmitContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export interface ContactMessageFilters {
  isResolved?: boolean;
}
