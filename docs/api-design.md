# Rental Hunt KE - API Design

> **Version:** 1.0
> **Status:** Draft
> **Owner:** Engineering Team
> **Related Documents:** [branding.md](./branding.md), [vision.md](./vision.md), [requirements.md](./requirements.md), [user-stories.md](./user-stories.md), [architecture.md](./architecture.md), [database.md](./database.md), [ui-guidelines.md](./ui-guidelines.md)

---

# 1. Purpose

Rental Hunt KE's backend is Supabase — PostgreSQL, Auth, Storage, and Realtime, fronted by PostgREST and RPC functions. There is no hand-written HTTP server. That makes it tempting to let every component call `supabase-js` directly wherever it's convenient — and exactly that temptation is what this document exists to close off.

This document defines the **API contract** the application is built against: every resource, every operation, every request/response shape, every error code, every permission rule, and every repository interface that sits between the UI and Supabase. It is the difference between "we use Supabase" and "we have an API," and it exists for four concrete reasons:

1. **Ambiguity elimination.** Every screen in `user-stories.md` needs a precise, agreed-upon data operation to call — this document is where that agreement is recorded before implementation, not improvised during it.
2. **Migration insurance.** `architecture.md` §9 commits to a Repository pattern specifically "to allow future migration away from Supabase with minimal impact." That promise is only real if every repository has a documented, stable contract independent of how it happens to be implemented today.
3. **A single normalized error/pagination/validation language.** Supabase, PostgREST, and Postgres each have their own error and response shapes. Nothing above the Repository layer should ever see any of them directly.
4. **A contract an AI coding agent can implement against.** Every operation below is specific enough to generate a repository method, a Zod schema, and a TanStack Query hook without guessing.

This document does not contradict `database.md` (the schema) or `architecture.md` (the layering) — it is the API-shaped view of both.

---

# 2. Architectural Overview

## 2.1 The Mandatory Data Flow

```text
Component
    ↓
Hook            (TanStack Query: useQuery / useMutation)
    ↓
Service         (business rules, orchestration, validation entry point)
    ↓
Repository      (Supabase calls, error normalization, snake_case ↔ camelCase mapping)
    ↓
Supabase        (PostgREST / RPC / Auth / Storage / Realtime)
```

This is the exact flow mandated in `architecture.md` §9, reproduced here because every section of this document assumes it.

## 2.2 Why Components Never Call Supabase Directly

- **Testability.** A component that calls `supabase.from(...)` cannot be unit-tested without a real or mocked Postgres connection. A component that calls a hook can be tested with a mocked hook.
- **Consistency.** If five components each independently write their own `supabase.from('properties').select(...)` query, a schema change (`database.md` evolving) means hunting down five call sites instead of one Repository method. `architecture.md`'s "no duplicated logic" principle is unenforceable otherwise.
- **Error normalization.** Supabase/PostgREST errors are Postgres-shaped (`{ code: '23505', message: 'duplicate key value...' }`). The UI should only ever see the standard envelope in §15. That translation happens in exactly one place: the Repository.
- **Type safety at the boundary.** Repositories are the one place that knows about `snake_case` database columns; everything above them works with camelCase, strongly-typed domain objects (`entities/*` per `architecture.md` §5).
- **Migration insurance.** See §1. If Rental Hunt KE ever needs a service that isn't PostgREST-shaped (a search engine, a payments provider, a public API gateway), only the Repository implementation changes — Services, Hooks, and Components are unaffected.
- **Authorization defense-in-depth.** RLS (`database.md` §9) is the *authoritative* authorization layer and holds even if the Repository has a bug. But Services still perform request-shape validation and business-rule checks (e.g. "is this date in the future?") *before* a request reaches the database, giving users a fast, specific error instead of a raw RLS rejection.

## 2.3 Example Sequence — Reading Data

```mermaid
sequenceDiagram
    participant C as PropertyListPage (Component)
    participant H as useProperties (Hook)
    participant S as PropertyService
    participant R as PropertyRepository
    participant DB as Supabase (PostgREST)

    C->>H: render, filters = {county, minPrice, ...}
    H->>S: propertyService.list(filters, cursor)
    S->>S: validate filters (Zod)
    S->>R: propertyRepository.list(filters, cursor)
    R->>DB: GET /rest/v1/properties?select=...&county_id=eq...
    DB-->>R: rows (snake_case)
    R->>R: map rows → Property[] (camelCase)
    R-->>S: { data: Property[], nextCursor }
    S-->>H: { data: Property[], nextCursor }
    H-->>C: { data, isLoading, isError, fetchNextPage }
```

## 2.4 Example Sequence — Writing Data with a Business Rule

```mermaid
sequenceDiagram
    participant C as PropertyDetailPage (Component)
    participant H as useCreateViewingRequest (Hook)
    participant S as ViewingRequestService
    participant R as ViewingRequestRepository
    participant DB as Supabase (Postgres)

    C->>H: submit booking form
    H->>S: viewingRequestService.create(input)
    S->>S: validate input (Zod): future date, notes length
    S->>R: viewingRequestRepository.create(input)
    R->>DB: INSERT INTO viewing_requests (...)
    DB->>DB: trigger: prevent_booking_unavailable_property()
    alt property unavailable
        DB-->>R: error (raised exception)
        R-->>S: AppError(PROPERTY_NOT_AVAILABLE)
        S-->>H: AppError(PROPERTY_NOT_AVAILABLE)
        H-->>C: show inline error (ui-guidelines.md §14)
    else success
        DB-->>R: new row
        R-->>S: ViewingRequest (camelCase)
        S-->>H: ViewingRequest
        H-->>C: show confirmation toast (VIEW-003)
    end
```

Note the trigger from `database.md` §9 firing *inside* the database transaction — the Repository does not re-implement that rule, it only translates the resulting error.

---

# 3. Resource Overview

| Resource | Backing Table(s) | MVP / Future | Primary Consumers |
|---|---|---|---|
| Authentication | `auth.users`, `profiles` | MVP | Guest, Customer, Agent, Moderator, Admin |
| Profiles | `profiles` | MVP | All authenticated roles |
| Roles | `roles` | MVP (reference) | Admin (display only) |
| Agencies | `agencies` | MVP | Guest (read), Agent (own), Admin |
| Agents | `agents` | MVP | Guest (read, via directory view), Agent (own), Admin |
| Properties | `properties` | MVP | Guest, Customer, Agent, Moderator, Admin |
| Property Images | `property_images` | MVP | Guest (read), Agent (own), Admin |
| Amenities | `amenities`, `property_amenities` | MVP | Guest (read), Agent (own), Admin |
| Reference Data | `counties`, `locations`, `property_types` | MVP | Guest (read), Admin (write) |
| Favorites | `favorites` | MVP | Customer |
| Viewing Requests | `viewing_requests` | MVP | Customer, Agent, Moderator, Admin |
| Property Verifications | `property_verifications` | MVP | Moderator, Admin, Agent (own, read) |
| Activity Logs | `activity_logs` | MVP | Moderator, Admin |
| Notifications | *(future)* | Future (`FUT`) | All authenticated roles |
| Reviews | *(future)* | Future | Customer, Guest (read) |
| Payments | *(future)* | Future (`FUT-001`) | Customer, Admin |
| Subscriptions | *(future)* | Future (`FUT-003`) | Agency, Admin |

## 3.1 Canonical Domain Types (TypeScript)

These are the camelCase shapes every Repository returns. Endpoint sections below reference these by name rather than repeating them.

```typescript
type UUID = string;
type ISODateTime = string; // ISO 8601, UTC

interface Profile {
  id: UUID;
  role: 'customer' | 'agent' | 'moderator' | 'admin';
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  notificationPreferences: Record<string, boolean>;
  isActive: boolean;
  createdAt: ISODateTime;
}

interface Agency {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  countyId: UUID | null;
  isActive: boolean;
}

interface Agent {
  id: UUID;
  profileId: UUID;
  agencyId: UUID;
  fullName: string;      // joined from profiles
  avatarUrl: string | null; // joined from profiles
  jobTitle: string | null;
  bio: string | null;
  isActive: boolean;
  agencyName: string; // joined from agencies, added 2026-08-05 — entities/property's public-facing PropertyAgent gained the same field via agent_directory's own join (database.md §9), a separate join from entities/agent's own
}

interface PropertyImage {
  id: UUID;
  propertyId: UUID;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
}

interface Amenity {
  id: UUID;
  name: string;
  icon: string | null;
}

interface Property {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  agencyId: UUID;
  agentId: UUID;
  propertyTypeId: UUID;
  propertyTypeName: string; // joined
  countyId: UUID;
  countyName: string;       // joined
  locationId: UUID;
  locationName: string;     // joined
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  depositAmount: number;
  currency: string;
  availabilityStatus: 'available' | 'reserved' | 'occupied' | 'hidden';
  verificationStatus: 'unverified' | 'pending_verification' | 'verified' | 'rejected';
  lastVerifiedAt: ISODateTime | null;
  isFeatured: boolean;
  isArchived: boolean;
  viewCount: number;
  images: PropertyImage[];
  amenities: Amenity[];
  agent: Pick<Agent, 'id' | 'fullName' | 'avatarUrl' | 'jobTitle' | 'bio' | 'agencyId'>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Favorite {
  propertyId: UUID;
  createdAt: ISODateTime;
  property: Property; // expanded by default — favorites are always shown with their property
}

interface ViewingRequest {
  id: UUID;
  customerId: UUID;
  propertyId: UUID;
  agentId: UUID;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  cancellationReason: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  property?: Pick<Property, 'id' | 'slug' | 'title' | 'images'>; // expanded on list endpoints
  // Sprint 6, BOOK-001 — `{ id, fullName, phone } | null`, resolved via
  // `profiles_select_own_customers_by_agent` (database.md §9). One shared
  // shape for both actors rather than two near-duplicate query columns: for
  // a customer's own listForCustomer()/cancel() call this just embeds their
  // own profile back to them (already allowed regardless of role).
  customer: { id: UUID; fullName: string; phone: string | null } | null;
}

interface PropertyVerification {
  id: UUID;
  propertyId: UUID;
  previousStatus: Property['verificationStatus'] | null;
  newStatus: Property['verificationStatus'];
  reviewedBy: UUID;
  reason: string | null;
  createdAt: ISODateTime;
}

// Sprint 7, database.md §5.14/§11. actorName is a Sprint 7 frontend-side
// convenience (an embedded `profiles(full_name)` join), not a raw DB column.
interface ActivityLog {
  id: UUID;
  actorId: UUID | null;
  actorName: string | null;
  action: string; // e.g. 'property.created', 'viewing.status_changed' — database.md §11's Tracked Events table
  entityType: string;
  entityId: UUID | null;
  metadata: Record<string, unknown>;
  createdAt: ISODateTime;
}
```

---

# 4. API Conventions

| Convention | Rule |
|---|---|
| **Naming** | Logical routes use kebab-case plural nouns (`/viewing-requests`). Database tables use `snake_case` (`database.md` §2). JSON fields use `camelCase`. The Repository is the only layer that translates between the two. |
| **Pluralization** | Collection routes are always plural (`/properties`, not `/property`). Singular sub-resources under a specific ID use the parent's plural form plus the child collection (`/properties/:id/images`). |
| **Filtering** | Query parameters, one per filterable field (`?county=nairobi&minPrice=20000&bedrooms=2`). Multi-value filters (amenities) accept a comma-separated list (`?amenities=wifi,parking`). See §17. |
| **Sorting** | `?sort=<field>_<direction>`, e.g. `sort=price_asc`, `sort=newest` (alias for `created_at_desc`). Exactly one sort key is active at a time in the MVP — no multi-column sort UI. |
| **Pagination** | `?cursor=<opaque>&limit=<n>` for keyset-paginated collections (public property feed); `?page=<n>&pageSize=<n>` for offset-paginated collections (bounded admin/dashboard lists). See §16. |
| **Searching** | `?q=<text>` for free-text/location search, mapped to `ILIKE`/`to_tsvector` matching (`database.md` §8). |
| **Field selection** | Not exposed as a client-tunable parameter in the MVP — each Repository method returns a fixed, purpose-built shape (the DTOs in §3.1) matching exactly what its consuming screen needs, avoiding both over-fetching and a general-purpose `?fields=` query-planning surface this app doesn't need yet. |
| **Relationship expansion** | Expansion is **not** client-controlled; it's baked into each Repository method's fixed `select()` (e.g. `list()` always includes the primary image and agent name; `getBySlug()` always includes the full gallery and amenities). This keeps payloads predictable and matches each screen's actual needs (§3.1). |
| **Soft deletes** | Every Repository read method filters out `deleted_at IS NOT NULL` (and, for `properties`, `is_archived = true`) by default. An explicit `includeArchived: true` parameter — available only to Agent (own properties) and Admin — opts back in. Soft-deleted rows are never returned to Guest/Customer under any parameter combination (enforced doubly by RLS, `database.md` §9). |
| **Timestamps** | Always ISO 8601, UTC, in `createdAt`/`updatedAt` fields. Never a Unix epoch, never a locale-formatted string. |
| **UUID usage** | Every resource identifier is a UUID v4 string, both in the database (`database.md` §2) and in the JSON contract. Human-readable identifiers (property `slug`, agency `slug`) are used only in user-facing URLs, never as the actual foreign key or lookup key inside repository calls beyond the single "get by slug" method. |

---

# 5. Authentication API

Backed entirely by Supabase Auth (`architecture.md` §7) plus the `profiles` table. There is no custom auth server — every operation below wraps a `supabase.auth.*` call and, where noted, the `handle_new_user` trigger (`database.md` §5.1).

## 5.1 Register

| | |
|---|---|
| **Purpose** | Create a new account (`AUTH-001`). |
| **Repository Function** | `authRepository.register(input: { email, password, fullName })` |
| **Underlying call** | `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` → `handle_new_user` trigger creates the `profiles` row with `role = 'customer'`. |
| **Request** | `{ email: string, password: string, fullName: string }` |
| **Response** | `{ user: Profile, session: Session }` |
| **Validation** | Email: valid format. Password: min 8 chars, at least 1 letter and 1 number. `fullName`: 2–100 chars. |
| **Possible Errors** | `VALIDATION_ERROR`, `EMAIL_ALREADY_REGISTERED` |
| **Authorization** | None — public endpoint (Guest). |

```json
// Request
{ "email": "amina@example.com", "password": "Kilimani2026", "fullName": "Amina Yusuf" }

// Response
{
  "success": true,
  "data": {
    "user": { "id": "b1e...", "role": "customer", "fullName": "Amina Yusuf", "phone": null, "avatarUrl": null },
    "session": { "accessToken": "eyJ...", "refreshToken": "v1.M...", "expiresAt": "2026-07-17T15:00:00Z" }
  }
}
```

## 5.2 Login

| | |
|---|---|
| **Purpose** | Authenticate an existing user (`AUTH-002`). |
| **Repository Function** | `authRepository.login(input: { email, password })` |
| **Underlying call** | `supabase.auth.signInWithPassword({ email, password })` |
| **Request** | `{ email: string, password: string }` |
| **Response** | `{ user: Profile, session: Session }` |
| **Validation** | Both fields required; no format validation beyond "non-empty" (format errors are folded into the generic auth failure to avoid leaking which field was wrong). |
| **Possible Errors** | `INVALID_CREDENTIALS` (deliberately generic — never distinguishes "wrong password" from "no such account"), `RATE_LIMITED` |
| **Authorization** | None — public endpoint. |

## 5.3 Logout

| | |
|---|---|
| **Purpose** | End the current session (`AUTH-003`). |
| **Repository Function** | `authRepository.logout()` |
| **Underlying call** | `supabase.auth.signOut()` |
| **Request** | *(none — uses current session)* |
| **Response** | `{ success: true }` |
| **Possible Errors** | `UNAUTHENTICATED` (already logged out) |
| **Authorization** | Any authenticated role. |

## 5.4 Refresh Session

| | |
|---|---|
| **Purpose** | Transparently renew an access token before expiry, backing `AUTH-005` (session persistence). |
| **Repository Function** | `authRepository.refreshSession()` — called automatically by the `supabase-js` client on a timer; not directly invoked by application code in the normal path. |
| **Underlying call** | `supabase.auth.refreshSession()` |
| **Response** | `{ session: Session }` |
| **Possible Errors** | `SESSION_EXPIRED` (refresh token itself has expired — the app redirects to login) |
| **Authorization** | Requires a valid (even if access-expired) refresh token. |

## 5.5 Forgot Password

| | |
|---|---|
| **Purpose** | Request a password reset email (`AUTH-004`). |
| **Repository Function** | `authRepository.requestPasswordReset(email: string)` |
| **Underlying call** | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` |
| **Request** | `{ email: string }` |
| **Response** | `{ success: true }` — **always**, regardless of whether the email exists, to avoid account enumeration. |
| **Validation** | Valid email format. |
| **Possible Errors** | `VALIDATION_ERROR`, `RATE_LIMITED` |
| **Authorization** | None. |

## 5.6 Reset Password

| | |
|---|---|
| **Purpose** | Complete a password reset using the emailed link's token. |
| **Repository Function** | `authRepository.resetPassword(input: { newPassword })` — called after the recovery link has already established a temporary session. |
| **Underlying call** | `supabase.auth.updateUser({ password: newPassword })` |
| **Request** | `{ newPassword: string }` |
| **Response** | `{ success: true }` |
| **Validation** | Same password rules as registration. |
| **Possible Errors** | `VALIDATION_ERROR`, `RESET_TOKEN_EXPIRED` |
| **Authorization** | Valid (unexpired) recovery session only. |

## 5.7 Get Current User

| | |
|---|---|
| **Purpose** | Resolve the active session into a full `Profile` on app load (`AUTH-005`). |
| **Repository Function** | `authRepository.getCurrentUser()` |
| **Underlying call** | `supabase.auth.getSession()` + `profileRepository.getById(session.user.id)` |
| **Response** | `Profile \| null` |
| **Possible Errors** | *(none — returns `null` rather than throwing when unauthenticated)* |
| **Authorization** | None required to call; returns `null` for Guests. |

## 5.8 Update Profile

| | |
|---|---|
| **Purpose** | Edit account details (`AUTH-006`, `CUST-003`). |
| **Repository Function** | `profileRepository.update(id: UUID, input: Partial<{ fullName, phone, avatarUrl, notificationPreferences }>)` |
| **Underlying call** | `supabase.from('profiles').update({...}).eq('id', auth.uid())` |
| **Request** | `{ fullName?: string, phone?: string, avatarUrl?: string, notificationPreferences?: Record<string, boolean> }` |
| **Response** | `Profile` (updated) |
| **Validation** | `fullName`: 2–100 chars if present. `phone`: E.164 format if present. `role` is never accepted in this payload — attempting to set it is a `VALIDATION_ERROR` at the Zod layer, backstopped by the `prevent_self_role_change()` trigger (`database.md` §9). |
| **Possible Errors** | `VALIDATION_ERROR`, `FORBIDDEN` (attempting to update another profile) |
| **Authorization** | Owner only (`id = auth.uid()`), or Admin. |

## 5.9 Update Email

| | |
|---|---|
| **Purpose** | Change the signed-in user's account email (`AUTH-006`). Email is stored in `auth.users`, never in `profiles` (`database.md` §4.1) — this does not touch the `profiles` table at all. |
| **Repository Function** | `credentialsRepository.updateEmail(newEmail: string)` |
| **Underlying call** | `supabase.auth.updateUser({ email: newEmail })` |
| **Request** | `{ newEmail: string }` |
| **Response** | `{ success: true }` — the address is not live until the user confirms it via the emailed link (Supabase's default "confirm new email" flow); the UI must say so, not imply the change is immediate. |
| **Validation** | Valid email format, same rule as registration (`api-design.md` §14). |
| **Possible Errors** | `VALIDATION_ERROR`, `EMAIL_ALREADY_REGISTERED` (email in use by another account), `UNAUTHENTICATED` |
| **Authorization** | Signed-in user only, acting on their own session — there is no `id` parameter, since `supabase.auth.updateUser` always targets the caller's own account. |

## 5.10 Update Password

| | |
|---|---|
| **Purpose** | Change the signed-in user's password after confirming their current one (`AUTH-006`) — distinct from §5.6's Reset Password, which is for a user who is locked out and has no current password to confirm. |
| **Repository Function** | `credentialsRepository.updatePassword(input: { currentPassword: string, newPassword: string })` |
| **Underlying call** | `supabase.auth.getUser()` (to read the caller's current email) → `supabase.auth.signInWithPassword({ email, password: currentPassword })` to confirm the current password is correct → `supabase.auth.updateUser({ password: newPassword })` |
| **Request** | `{ currentPassword: string, newPassword: string }` |
| **Response** | `{ success: true }` |
| **Validation** | `newPassword`: same rules as registration (`api-design.md` §14). `currentPassword`: required, non-empty. |
| **Possible Errors** | `VALIDATION_ERROR`, `INVALID_CREDENTIALS` (current password is wrong), `UNAUTHENTICATED` |
| **Authorization** | Signed-in user only, re-confirmed via the `signInWithPassword` step above. |

## 5.11 Sign Out of Other Devices

| | |
|---|---|
| **Purpose** | Session-management hardening (post-Sprint-8, 2026-08-04, ADR-033) — revoke every other active session for this account (e.g. a device the user no longer trusts or forgot to sign out of), without also signing out the device they're using to trigger it. |
| **Repository Function** | `credentialsRepository.signOutOtherDevices(): Promise<void>` |
| **Underlying call** | `supabase.auth.signOut({ scope: 'others' })` — deliberately not `scope: 'global'`, which would also end the caller's own current session. |
| **Request** | none |
| **Response** | `{ success: true }` |
| **Validation** | none — no input. |
| **Possible Errors** | `UNAUTHENTICATED` |
| **Authorization** | Signed-in user only, acting on their own sessions — there is no `id` parameter, `scope: 'others'` is always relative to the caller's own current session. |

---

# 6. Property API

Route prefix: none (logical root). All routes below are the Repository's contract, not hand-built HTTP handlers — see §2.1.

## 6.1 List Properties

| | |
|---|---|
| **Method / Route** | `GET /properties` |
| **Repository Function** | `propertyRepository.list(filters: PropertyFilters, cursor?: string, limit = 20)` |
| **Underlying call** | `supabase.from('properties').select('*, images:property_images(*), agent:agents(*, profile:profiles(full_name, avatar_url))').match({...}).order('created_at', { ascending: false }).limit(limit)` with a keyset `WHERE (created_at, id) < (cursor.createdAt, cursor.id)` predicate. |
| **Request Parameters** | See §17 (Filtering) for the full filter set; plus `cursor`, `limit`, `sort`, `q`. |
| **Response Schema** | `{ data: Property[], meta: { nextCursor: string \| null, hasMore: boolean } }` |
| **Permissions** | Public (Guest and above). RLS restricts rows to `is_archived = false AND deleted_at IS NULL AND verification_status <> 'rejected'` (`database.md` §9) regardless of what the caller requests. |
| **Errors** | `VALIDATION_ERROR` (malformed filter values, e.g. `minPrice` not numeric) |
| **Pagination** | Cursor-based (§16.1). |

```json
// GET /properties?county=nairobi&bedrooms=2&sort=price_asc&limit=2
{
  "success": true,
  "data": [
    {
      "id": "3f2...", "slug": "2br-apartment-kilimani-3f2",
      "title": "Modern 2BR Apartment in Kilimani",
      "rentAmount": 55000, "currency": "KES", "bedrooms": 2, "bathrooms": 2,
      "availabilityStatus": "available", "verificationStatus": "verified",
      "images": [{ "id": "img1", "imageUrl": "https://.../property-images/3f2.../1.jpg", "displayOrder": 0 }],
      "agent": { "id": "ag1", "fullName": "James Mwangi", "avatarUrl": null }
    }
  ],
  "meta": { "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE1VDEwOjAwOjAwWiIsImlkIjoiM2YyIn0=", "hasMore": true }
}
```

## 6.2 Get Property

| | |
|---|---|
| **Method / Route** | `GET /properties/:slug` |
| **Repository Function** | `propertyRepository.getBySlug(slug: string)` |
| **Underlying call** | The same `PROPERTY_COLUMNS` select §6.1 uses (`.eq('slug', slug).single()` in place of the cursor/limit chain) — `agent:agent_directory(agent_id, agency_id, full_name, avatar_url, job_title, bio, agency_name)`, not a raw `agents`/`profiles` join (corrected 2026-07-27, Sprint 4 — the `agents`/`profiles` join in this line's earlier draft predated the `agent_directory` view Sprint 3 actually built and never matched the implementation; `agency_name` added 2026-08-05). |
| **Response Schema** | `Property` (full shape, §3.1) |
| **Permissions** | Public, subject to the same visibility rule as §6.1. |
| **Errors** | `PROPERTY_NOT_FOUND` |
| **Pagination** | N/A (single resource). |
| **View count** | `properties.view_count` (§5.8) is **not** incremented by this endpoint — built instead as its own call (Sprint 6, `AGENT-008`): `propertyRepository.incrementViewCount(id)` → `supabase.rpc('increment_property_view_count', { p_property_id: id })`, `security definer` since RLS can't scope a single-column update and both guests and customers view details (`execute` granted to `anon, authenticated`). Fired once via `useTrackPropertyView`'s `useEffect` on `PropertyDetailPage` mount, deliberately **not** folded into this endpoint's own query — a TanStack Query refetch/refocus on the same slug would otherwise double-count. Errors are swallowed client-side (no user-facing state depends on this call succeeding), but the Repository method itself still surfaces a real `AppError` so it stays unit-testable. **Correction, 2026-08-05:** this row described the intended design correctly, but `useTrackPropertyView` was never actually written — `PropertyDetailPage` never called it, so `view_count` genuinely never incremented from real traffic since Sprint 6. Found while answering a developer question about how view counting works, and built to this row's own already-correct spec (`features/property-details/hooks/useTrackPropertyView.ts`), with `sessionStorage`-keyed dedup as the concrete mechanism behind "would otherwise double-count." |

## 6.3 Search Properties

Not a separate endpoint — `q` is a parameter on `GET /properties` (§6.1) matched against the GIN full-text index on `title`/`description` and `ILIKE` on `locations.name`/`counties.name` (`database.md` §8, NFR-SEARCH-002). Documented separately here only because `user-stories.md` (`DISC-002`) treats it as a distinct user journey.

```json
// GET /properties?q=kilimani
```

## 6.4 Filter Properties

Also not a separate endpoint — see §17 for the full filter parameter reference applied to `GET /properties`.

## 6.5 Featured Properties

| | |
|---|---|
| **Method / Route** | `GET /properties/featured` |
| **Repository Function** | `propertyRepository.listFeatured(limit = 8)` |
| **Underlying call** | `supabase.from('properties').select(...).eq('is_featured', true).order('created_at', { ascending: false }).limit(limit)` — served by the partial index in `database.md` §8. |
| **Response Schema** | `{ data: Property[] }` (no pagination — bounded, small set, `FR-HOME-002`) |
| **Permissions** | Public. `is_featured = true` can only exist alongside `verification_status = 'verified'` (enforced by a `CHECK` constraint, `database.md` §5.8), so this endpoint needs no additional verification filter. |
| **Errors** | *(none expected — empty array is a valid response)* |

## 6.6 Nearby Properties *(Future)*

| | |
|---|---|
| **Method / Route** | `GET /properties/nearby` *(not implemented in MVP)* |
| **Sketch** | `?lat=&lng=&radiusKm=` using PostGIS `ST_DWithin` once/if the `postgis` extension is enabled — `latitude`/`longitude` columns already exist (`database.md` §5.8), so this is additive, not a schema change. |
| **Status** | Deferred — no MVP user story requires proximity search; `DISC-002` is county/neighborhood-based. |

## 6.7 Property Images

| Operation | Method / Route | Repository Function | Permissions |
|---|---|---|---|
| List | `GET /properties/:id/images` | `propertyImageRepository.listByProperty(propertyId)` | Public (parent property visible) |
| Upload | `POST /properties/:id/images` | `propertyImageRepository.upload(propertyId, file: File, altText?: string)` | Agent (own agency's property), Admin |
| Delete | `DELETE /properties/:id/images/:imageId` | `propertyImageRepository.delete(imageId)` | Agent (own property), Admin |
| Reorder | `PATCH /properties/:id/images/reorder` | `propertyImageRepository.reorder(propertyId, orderedImageIds: UUID[])` | Agent (own property), Admin |

**Upload (Sprint 6, `AGENT-005`) is the real two-step flow (§10.1) as one method, not a metadata-only `create`** (corrected — an earlier draft of this row assumed the file was already uploaded elsewhere): Storage upload to `{propertyId}/{crypto.randomUUID()}-{file.name}` (`database.md` §10's `property-images` bucket), then a `property_images` metadata insert with `display_order` = `max(display_order) + 1` for that property. On a metadata-insert failure, the just-uploaded Storage object is removed before rethrowing — the concrete mechanism behind `AGENT-005`'s "upload failures do not corrupt or remove existing images." `delete()` removes the DB row first (immediate gallery update), then best-effort removes the Storage object (an orphaned object on failure is a minor cost, not a correctness bug, since the DB row is the gallery's source of truth). `reorder()` is metadata-only, one `display_order` update per id.

`Response Schema`: `PropertyImage[]` for list/reorder, `PropertyImage` for upload. `Errors`: `VALIDATION_ERROR` (wrong file type/size, checked client-side by `validatePropertyImageFile()`, §14), `PROPERTY_NOT_FOUND`, `IMAGE_NOT_FOUND`, `STORAGE_ERROR`, `FORBIDDEN`.

## 6.8 Property Availability

| | |
|---|---|
| **Method / Route** | `PATCH /properties/:id/availability` |
| **Repository Function** | `propertyRepository.updateAvailability(id: UUID, status: PropertyStatus)` (`AGENT-006`) |
| **Underlying call** | `supabase.from('properties').update({ availability_status: status }).eq('id', id)` — triggers `property.availability_changed` in `activity_logs` (`database.md` §11). |
| **Request** | `{ status: 'available' \| 'reserved' \| 'occupied' \| 'hidden' }` |
| **Response Schema** | `Property` |
| **Permissions** | Agent (own agency's property only), Admin. |
| **Errors** | `VALIDATION_ERROR` (invalid enum value), `FORBIDDEN`, `PROPERTY_NOT_FOUND` |

## 6.9 Property Verification

| | |
|---|---|
| **Method / Route** | `POST /properties/:id/verification` |
| **Repository Function** | `verificationRepository.setStatus(propertyId: UUID, input: { status, reason? })` (`AGENT-007`) |
| **Underlying call** | `supabase.rpc('set_property_verification', { property_id: propertyId, new_status: status, reason })` — the only path allowed to write `verification_status`/`verified_by`/`last_verified_at`, and the sole writer of `property_verifications` (`database.md` §9, §5.15). |
| **Request** | `{ status: 'verified' \| 'rejected' \| 'pending_verification', reason?: string }` |
| **Response Schema** | `{ property: Property, verification: PropertyVerification }` |
| **Validation** | `reason` required when `status = 'rejected'` (enforced inside the RPC, not a table `CHECK`, per `database.md` §5.15). |
| **Permissions** | Moderator, Admin only. |
| **Errors** | `VALIDATION_ERROR`, `FORBIDDEN`, `PROPERTY_NOT_FOUND` |

## 6.10 Submit Property For Verification

Sprint 6, `AGENT-007`'s agent-facing half — built ahead of §6.9's moderator/admin approve/reject action (Sprint 7), which this endpoint is deliberately narrower than: it only ever moves a listing to `pending_verification`, never touches `verified_by`/`last_verified_at`, and never writes `property_verifications` (doesn't exist yet).

| | |
|---|---|
| **Method / Route** | `POST /properties/:id/submit-verification` |
| **Repository Function** | `propertyRepository.submitForVerification(id: UUID)` |
| **Underlying call** | `supabase.rpc('submit_property_for_verification', { p_property_id: id })`, then a re-fetch by id for the full embedded `Property` DTO (the RPC itself returns only the raw `properties` row). `security definer`, checks `current_role() = 'agent'` and own-agency ownership internally (`database.md` §9) — RLS is not the enforcement layer here, the RPC's own guard clause is. |
| **Response Schema** | `Property` |
| **Validation** | Only allowed while `verification_status IN ('unverified', 'rejected')`. |
| **Permissions** | Agent, own agency only. |
| **Errors** | `FORBIDDEN` (wrong agency or not an agent — `42501`), `INVALID_STATE_TRANSITION` (wrong source status — dedicated errcode `RH002`, mapped like `RH001`), `PROPERTY_NOT_FOUND` |

---

# 7. Favorites API

## 7.1 Save Favorite

| | |
|---|---|
| **Method / Route** | `POST /favorites` |
| **Repository Function** | `favoritesRepository.save(propertyId: UUID)` (`FAV-001`) |
| **Underlying call** | `supabase.from('favorites').upsert({ customer_id: auth.uid(), property_id }, { onConflict: 'customer_id,property_id', ignoreDuplicates: true })` |
| **Request** | `{ propertyId: UUID }` |
| **Response** | `Favorite` |
| **Validation** | `propertyId` must be a valid UUID referencing a non-deleted, non-archived property. |
| **Duplicate handling** | **Idempotent.** Saving an already-favorited property is a no-op success (`onConflict` + `ignoreDuplicates`), not a `CONFLICT` error — the user's intent ("I want this saved") is already satisfied. |
| **Permissions** | Customer only (own `customer_id`, enforced by RLS). |
| **Errors** | `UNAUTHENTICATED`, `PROPERTY_NOT_FOUND` |

## 7.2 Remove Favorite

| | |
|---|---|
| **Method / Route** | `DELETE /favorites/:propertyId` |
| **Repository Function** | `favoritesRepository.remove(propertyId: UUID)` (`FAV-002`) |
| **Underlying call** | `supabase.from('favorites').delete().match({ customer_id: auth.uid(), property_id: propertyId })` |
| **Response** | `{ success: true }` |
| **Duplicate handling** | Removing a non-favorited property is also idempotent — a successful no-op, not a `NOT_FOUND` error. |
| **Permissions** | Customer only, own rows. |
| **Errors** | `UNAUTHENTICATED` |

## 7.3 List Favorites

| | |
|---|---|
| **Method / Route** | `GET /favorites` |
| **Repository Function** | `favoritesRepository.list(page = 1, pageSize = 20)` (`FAV-003`) |
| **Underlying call** | `supabase.from('favorites').select('created_at, property:properties(*, images:property_images(*))').eq('customer_id', auth.uid()).order('created_at', { ascending: false }).range(...)` |
| **Response Schema** | `{ data: Favorite[], meta: { page, pageSize, total } }` |
| **Permissions** | Customer only, own rows. |
| **Pagination** | Offset (§16.2) — a customer's favorites list is small and bounded, so simple page numbers are appropriate. |
| **Errors** | `UNAUTHENTICATED` |

## 7.4 List Favorite Property IDs

| | |
|---|---|
| **Method / Route** | Not a separate REST endpoint — a lighter-weight query shape of §7.3, not documented there originally. |
| **Repository Function** | `favoritesRepository.listIds()` (added Sprint 5) |
| **Underlying call** | `supabase.from('favorites').select('property_id')` — no embed. |
| **Response** | `string[]` (property IDs only) |
| **Why it exists** | §7.3's `list()` expands the full `Favorite` shape (property + images) — too heavy to call from every `PropertyCard` render just to answer "is this one saved?" (`useFavoriteIds()`, shared across every card-rendering widget/page via one cached TanStack Query key). |
| **Permissions** | Customer only, own rows. |
| **Errors** | `UNAUTHENTICATED` |

---

# 8. Viewing Request API

## 8.1 Status State Machine

```mermaid
stateDiagram-v2
    [*] --> pending: create (VIEW-001)
    pending --> confirmed: agent confirms (BOOK-002)
    pending --> cancelled: customer or agent cancels (VIEW-004 / BOOK-004)
    confirmed --> confirmed: agent reschedules (BOOK-003, date/time only)
    confirmed --> completed: agent marks completed (BOOK-005)
    confirmed --> cancelled: customer or agent cancels
    confirmed --> no_show: agent marks no-show (BOOK-006)
    completed --> [*]
    cancelled --> [*]
    no_show --> [*]
```

`completed`, `cancelled`, and `no_show` are terminal — no operation transitions a viewing request out of them. Every transition is validated against this table at the Service layer *before* the Repository call, so an invalid transition returns a specific `INVALID_STATE_TRANSITION` error rather than a generic database failure.

## 8.2 Create Viewing

| | |
|---|---|
| **Method / Route** | `POST /viewing-requests` |
| **Repository Function** | `viewingRequestRepository.create(input: { propertyId, requestedDate, requestedTime, notes? })` (`VIEW-001`, `VIEW-002`) |
| **Underlying call** | `supabase.from('viewing_requests').insert({ customer_id: auth.uid(), property_id, agent_id: <resolved from property>, requested_date, requested_time, notes })` — the `prevent_booking_unavailable_property()` trigger (`database.md` §9) rejects the insert if the property isn't bookable. |
| **Request** | `{ propertyId: UUID, requestedDate: string (YYYY-MM-DD), requestedTime: string (HH:mm), notes?: string }` |
| **Response** | `ViewingRequest` |
| **Validation** | `requestedDate` must be today or later. `notes` max 500 chars. |
| **Permissions** | Customer only. |
| **Errors** | `VALIDATION_ERROR`, `PROPERTY_NOT_FOUND`, `PROPERTY_NOT_AVAILABLE` |

```json
// Request
{ "propertyId": "3f2...", "requestedDate": "2026-07-22", "requestedTime": "14:00", "notes": "Available after 1pm on weekdays." }

// Response
{
  "success": true,
  "data": {
    "id": "vr1...", "propertyId": "3f2...", "agentId": "ag1...",
    "requestedDate": "2026-07-22", "requestedTime": "14:00",
    "status": "pending", "notes": "Available after 1pm on weekdays.",
    "createdAt": "2026-07-17T09:12:00Z"
  }
}
```

## 8.3 List User Viewings

| | |
|---|---|
| **Method / Route** | `GET /viewing-requests?scope=mine` |
| **Repository Function** | `viewingRequestRepository.listForCustomer(input?: { status?: ViewingStatus[]; page?: number; pageSize?: number; sort?: 'requestedDateAsc' \| 'requestedDateDesc' \| 'createdAtDesc' })` (`VIEW-005`, `CUST-001`, `CUST-002`) |
| **Permissions** | Customer, own rows only (enforced by RLS — no explicit `customer_id` filter needed in the query itself). |
| **Pagination** | Offset (§16.2). |
| **Sort (added Sprint 5)** | A single method serves three different orderings rather than three near-duplicate methods: `CUST-001` (Upcoming) uses `requestedDateAsc`, `CUST-002` (Completed) uses `requestedDateDesc`, `VIEW-005` (full history) uses `createdAtDesc` ("most recent request first" means most recently *submitted*, not most recently *scheduled*). Changed from the originally documented positional `(status?, page, pageSize)` signature to this options object once a third ordering need (beyond just status-filtering) became clear. |
| **Errors** | `UNAUTHENTICATED` |

## 8.4 List Property Viewings (Agent Queue)

| | |
|---|---|
| **Method / Route** | `GET /viewing-requests?scope=agency` |
| **Repository Function** | `viewingRequestRepository.listForAgent(input?: ListViewingRequestsInput)` (`BOOK-001`) — the same options-object signature as `listForCustomer` (`{ status?, page?, pageSize?, sort? }`), not the positional `(status?, page, pageSize)` this row originally documented; kept in lockstep with §8.3's own already-corrected signature rather than drifting into a second, inconsistent shape. |
| **Response includes** | Each `ViewingRequest.customer` (`{ id, fullName, phone }`) is populated here — `listForCustomer`'s own call leaves it populated too (it's simply the caller's own profile), but this is the endpoint that actually needs it: BOOK-001's "customer, property, requested date/time, status" (`database.md` §9, Gap 6's `profiles_select_own_customers_by_agent` policy). |
| **Permissions** | Agent (rows where `agent_id` is their own), Moderator/Admin (all). |
| **Pagination** | Offset (§16.2). |

## 8.5 Update / Reschedule Viewing

| | |
|---|---|
| **Method / Route** | `PATCH /viewing-requests/:id` |
| **Repository Function** | `viewingRequestRepository.reschedule(id: UUID, input: { requestedDate, requestedTime })` (`BOOK-003`) |
| **Validation** | Only allowed while `status IN ('pending', 'confirmed')`; new date must be today or later. |
| **Permissions** | Agent (own), Admin. |
| **Errors** | `VALIDATION_ERROR`, `INVALID_STATE_TRANSITION`, `FORBIDDEN` |

## 8.6 Cancel Viewing

| | |
|---|---|
| **Method / Route** | `POST /viewing-requests/:id/cancel` |
| **Repository Function** | `viewingRequestRepository.cancel(id: UUID, reason?: string)` (`VIEW-004`, `BOOK-004`) |
| **Validation** | Only allowed while `status IN ('pending', 'confirmed')`. |
| **Permissions** | Customer (own request), Agent (own assigned request), Admin. |
| **Errors** | `INVALID_STATE_TRANSITION`, `FORBIDDEN` |

## 8.7 Confirm Viewing

| | |
|---|---|
| **Method / Route** | `POST /viewing-requests/:id/confirm` |
| **Repository Function** | `viewingRequestRepository.confirm(id: UUID)` (`BOOK-002`) |
| **Validation** | Only allowed while `status = 'pending'`. |
| **Permissions** | Agent (own), Admin. |
| **Errors** | `INVALID_STATE_TRANSITION`, `FORBIDDEN` |

## 8.8 Complete Viewing

| | |
|---|---|
| **Method / Route** | `POST /viewing-requests/:id/complete` |
| **Repository Function** | `viewingRequestRepository.complete(id: UUID)` (`BOOK-005`) |
| **Validation** | Only allowed while `status = 'confirmed'`. |
| **Permissions** | Agent (own), Admin. |
| **Errors** | `INVALID_STATE_TRANSITION`, `FORBIDDEN` |

## 8.9 No Show

| | |
|---|---|
| **Method / Route** | `POST /viewing-requests/:id/no-show` |
| **Repository Function** | `viewingRequestRepository.markNoShow(id: UUID)` (`BOOK-006`) |
| **Validation** | Only allowed while `status = 'confirmed'`. |
| **Permissions** | Agent (own), Admin. |
| **Errors** | `INVALID_STATE_TRANSITION`, `FORBIDDEN` |

---

# 9. Admin API

All routes below require `moderator` or `admin` (verification/viewing oversight) or `admin` alone (user/agency management), per the RLS matrix in `database.md` §9.

**Implementation status (Sprint 7, `roadmap.md` §11):** Dashboard Metrics, Manage Users, Manage Agencies, Verification Queue, Verification Action, and Activity Logs are all built and reachable through real UI (`/admin`, `/admin/verification-queue`, `/admin/users`, `/admin/agencies`, `/admin/analytics`, `/admin/activity-logs`). **Manage Properties remains a `PlaceholderPage` stub, deliberately not built** — no Sprint 7 DoD line names a dedicated admin property-management screen; verification is fully covered by the Verification Queue, and `propertyRepository` already gives admin full CRUD via RLS (`database.md` §9's `properties_update_admin`) for any future session that adds the screen. `Repository Function` below reflects the real, split implementation rather than one monolithic `adminRepository` this section originally sketched — each repository lives in the `entities/`/`features/` slice ADR-026/028/030's "2+ real consumers" test actually puts it in.

| Operation | Method / Route | Repository Function | Permissions | Notes |
|---|---|---|---|---|
| Dashboard Metrics | `GET /admin/metrics` | `adminMetricsRepository.getMetrics()` (`features/admin-dashboard`) | Admin | Platform-wide counts: total properties, pending verifications, active agencies, bookings in the last 7 days. |
| Manage Properties | `GET /admin/properties`, `PATCH /admin/properties/:id` | `propertyRepository.list({ scope: 'all' })`, `.update()` | Admin | **Not built (Sprint 7) — deliberately out of scope, see status note above.** Bypasses the public visibility filter (§4); can force-archive any listing, whenever a future sprint adds this screen. |
| Manage Users | `GET /admin/users`, `PATCH /admin/users/:id`, `POST admin-invite-user`, `POST admin-delete-user` | `adminUserRepository.list()`, `.adminUpdate(id, { role?, isActive?, fullName?, phone? })`, `.invite({ email, fullName, role })`, `.deleteUser(id)` (`features/admin-users`) | Admin | The only path that can change `profiles.role` (bypasses the self-role-change trigger, `database.md` §9). `adminUpdate` covers every plain `profiles` column (role/status already existed; `fullName`/`phone` added post-Sprint-8, 2026-08-04 — no new access path, `profiles_update_all_admin` already grants it). `invite`/`deleteUser` (post-Sprint-8) both go through a dedicated Edge Function instead — the only two Manage Users operations that touch `auth.users`, which RLS can never reach regardless of role. Feature-local, not an extension of `profileRepository` — no other consumer needs any of these (ADR-030, ADR-032). |
| Manage Agencies | `GET /admin/agencies`, `POST /admin/agencies`, `PATCH /admin/agencies/:id` | `agencyRepository.list()`, `.getById(id)`, `.create()`, `.update()` (`entities/agency`) | Admin | Agency onboarding is admin-driven in the MVP (`FUT-002` self-service onboarding is deferred). `getById` is a Sprint 7 extension to the §13 contract below — the admin edit form needs to fetch a single agency to prefill, and `list()`'s `Agency[]` shape has no id-scoped variant. No agency-logo upload UI — `logoUrl` is a plain optional text field (the DoD says "create a new agency," not "upload a logo"; `database.md` §10's `agency-logos` bucket remains unbuilt). |
| Verification Queue | `GET /admin/properties/pending-verification` | `verificationRepository.listPending()` (`entities/property-verification`) | Moderator, Admin | Filters `properties.verification_status = 'pending_verification'`, ordered oldest-first (a fair review queue). |
| Verification Review | `GET /admin/properties/:id` | `adminVerificationService.getById(id)` → `propertyRepository.getByIdAdmin(id)` (`features/admin-verification` / `entities/property`) | Moderator, Admin | Post-Sprint-8 (2026-08-04) addition — "Review" navigates to a dedicated page (`ui-guidelines.md` §12.14.1) showing the full listing (gallery, price, location/map, description, amenities, agent), not just a title, before a decision is made. Reuses `getByIdAdmin()` (already existed for verification history) rather than a new query — RLS's `properties_select_all_moderator_admin` policy is the authority, works for any status, not just pending. |
| Verification Action | see §6.9 | `verificationRepository.setStatus()` (`entities/property-verification`) | Moderator, Admin | Same RPC as the Agent Dashboard's verification screen. Now submitted from the bottom of the review page above (`VerificationActionBar`) instead of a separate dialog. |
| Activity Logs | `GET /admin/activity-logs` | `activityLogRepository.list(filters)`, `.delete(id)` (`features/admin-activity-log`) | Moderator (read), Admin (read + retention delete) | Filterable by `entityType`, `entityId`, `actorId`, date range. |
| Analytics | `GET /admin/analytics` | `adminAnalyticsRepository.getAnalytics(range)` (`features/admin-analytics`) | Admin | Aggregates total listing views, viewing-request volume in range, and per-agency listing counts (`AGENT-008` at the platform level) — client-side grouped from plain row lists, mirroring `agentAnalyticsRepository.listPropertyAnalytics()`'s existing shape, not a new SQL aggregation function. |
| Contact Messages | `GET /contact-messages`, `PATCH /contact-messages/:id`, `DELETE /contact-messages/:id` | `contactMessageRepository.list()`, `.setResolved()`, `.delete()` (`entities/contact-message`) | Admin | Added 2026-08-05 (`CONTENT-003`). See §23 for the full contract, including the public submission endpoint. Admin-only, not moderator — support/correspondence triage, not verification or activity oversight. |

---

# 10. Storage API

Buckets, MIME types, and size limits are defined in `database.md` §10 and reproduced here in their API-operation form.

## 10.1 Upload Property Image

| | |
|---|---|
| **Method / Route** | `POST /properties/:id/images/upload` (two-step: storage upload, then metadata row) |
| **Repository Function** | `propertyImageRepository.upload(propertyId: UUID, file: File, altText?: string)` |
| **Underlying calls** | 1. `supabase.storage.from('property-images').upload('${propertyId}/${uuid()}.${ext}', file)` 2. `propertyImageRepository.create(propertyId, { imageUrl: publicUrl, altText, displayOrder })` (§6.7) |
| **Allowed MIME types** | `image/jpeg`, `image/png`, `image/webp` |
| **Max file size** | 5 MB |
| **Validation** | MIME type and size checked client-side (fast feedback) *and* re-checked by the Storage bucket policy (`database.md` §10) — never trust the client-side check alone. |
| **Permissions** | Agent (own property), Admin. |
| **Errors** | `VALIDATION_ERROR` (bad type/size), `STORAGE_ERROR`, `FORBIDDEN` |

## 10.2 Delete Image

| | |
|---|---|
| **Method / Route** | `DELETE /properties/:id/images/:imageId` |
| **Repository Function** | `propertyImageRepository.delete(imageId: UUID)` |
| **Underlying calls** | `supabase.storage.from('property-images').remove([path])` then delete the `property_images` row. |
| **Permissions** | Agent (own property), Admin. |
| **Errors** | `IMAGE_NOT_FOUND`, `STORAGE_ERROR`, `FORBIDDEN` |

## 10.3 Reorder Images

See §6.7 — a metadata-only operation (`display_order` update), no Storage interaction.

## 10.4 Public URL Generation

Since `property-images`, `agency-logos`, and `avatars` are all **public** buckets (`database.md` §10), URL generation is a pure client-side call with no signed-URL round-trip: `supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl`. This value is what's persisted in `property_images.image_url` / `agencies.logo_url` / `profiles.avatar_url` — the Repository stores the resolved public URL, not the bare storage path, so consumers never need to know which bucket a given image came from.

---

# 11. Realtime Events

Backed by Supabase Realtime's `postgres_changes` (row-level change feed, RLS-aware) rather than custom `broadcast` channels — every subscription below only receives rows the subscribing user is already permitted to `SELECT` per `database.md` §9.

| Event | Channel | Payload | Subscribers | Use Case |
|---|---|---|---|---|
| Property Updated | `postgres_changes` on `properties`, filter `id=eq.<id>` | Full updated row (mapped to `Property`) | Any user with the property detail page open | Live-update availability/price if an agent edits the listing while a customer is viewing it. |
| Availability Changed | *(subset of the above, distinguished client-side by diffing `availability_status`)* | `{ propertyId, from, to }` | Customers with the property open or favorited; the property list if visible | Reflect `AGENT-006` changes without a manual refresh. |
| Viewing Confirmed / Status Changed | `postgres_changes` on `viewing_requests`, filter `customer_id=eq.<id>` (customer side) or `agent_id=eq.<id>` (agent side) | Full updated row (mapped to `ViewingRequest`) | The requesting customer (`FR-BOOK-006`); the assigned agent's dashboard | Live status badge updates on `CUST-001` and `BOOK-001` without polling. |
| Booking Cancelled | *(subset of the above, `status = 'cancelled'`)* | `{ viewingRequestId, cancelledBy, reason }` | Same as above | Immediate reflection of `VIEW-004`/`BOOK-004`. |
| Notification Created *(Future)* | `postgres_changes` on `notifications`, filter `profile_id=eq.<id>` | `{ id, type, payload }` | The owning profile | Backs a future in-app notification bell; no MVP consumer since `notifications` doesn't exist yet (`database.md` §15). |

**Subscription pattern:** each Hook that needs realtime data (e.g. `useViewingRequests`) opens its `postgres_changes` subscription in a `useEffect`, and on any event simply invalidates the corresponding TanStack Query cache key (§24) rather than manually patching local state — letting the existing `list`/`get` Repository methods remain the single source of truth for shape.

---

# 12. Edge Functions

Edge Functions (Deno, deployed alongside the Supabase project — `architecture.md` §4) are reserved for logic that **cannot** or **should not** live in a Repository/Service/RLS combination. The decision test:

```mermaid
flowchart TD
    A[New backend behavior needed] --> B{Needs a secret\n(email/SMS provider key,\npayment gateway key)?}
    B -- Yes --> E[Edge Function]
    B -- No --> C{Must run on a schedule\nor independent of any\nclient request?}
    C -- Yes --> E
    C -- No --> D{CPU/time-heavy\n(image processing,\nbulk export)?}
    D -- Yes --> E
    D -- No --> F[Repository + Service + RLS/trigger]
```

| Edge Function | Trigger | Purpose |
|---|---|---|
| `admin-invite-user` **(built, post-Sprint-8)** | Direct invoke — `adminUserRepository.invite()` | The first Edge Functions actually built in this project, and the "rare manual admin action" case this section's closing paragraph already anticipated. Verifies the caller is a current admin (RLS can't help — `service_role` bypasses it entirely), then calls `auth.admin.inviteUserByEmail()`. Needs `SUPABASE_SERVICE_ROLE_KEY`, never reachable from the frontend. |
| `admin-delete-user` **(built, post-Sprint-8)** | Direct invoke — `adminUserRepository.deleteUser()` | Same admin check, then checks for any owned `properties`/`viewing_requests`/`property_verifications` rows (all `on delete restrict`) *and* any property where they're recorded as `verified_by` (`on delete set null`, but still blocked by `enforce_verification_authority()`'s trigger even on a cascaded write — found via real testing, not inspection) before calling `auth.admin.deleteUser()` — returns `USER_HAS_ACTIVITY` instead of a raw error when blocked. See ADR-032 for why hard-delete is scoped this narrowly. |
| `send-booking-notifications` | Database webhook on `viewing_requests` insert/update | Sends email (and future SMS) to the customer/agent on booking creation and every status change — requires an email provider secret key, which must never reach the client. |
| `verification-workflow` | Database webhook on `property_verifications` insert | Notifies the affected agent when a listing is verified/rejected; future extension point for auto-flagging listings that have sat in `pending_verification` too long. |
| `daily-analytics` | Scheduled (`pg_cron` or Supabase Scheduled Functions, daily) | Aggregates `view_count` and viewing-request volume into a summary the Admin Analytics screen (§9) reads, instead of computing heavy aggregates on every dashboard load. |
| `scheduled-cleanup` | Scheduled, weekly | Purges/archives `activity_logs` rows past the retention window (`database.md` §11) and flags properties that have been `pending_verification` for an unreasonable time. |
| `process-property-image` | Storage webhook on upload to `property-images` | Optional MVP-nice-to-have: generates a compressed/resized variant so the client never uploads (or the app never serves) an unnecessarily large original — supports `SYS-004`. |

Everything below `admin-invite-user`/`admin-delete-user` above reacts to database/storage webhooks or a schedule, none called directly by the frontend. Where a Service does need to *invoke* one directly (rare — e.g. a manual "resend notification" admin action, or the two built above), it goes through `supabase.functions.invoke(name, { body })`, still behind a Repository method, never called from a component. Both built functions live in `supabase/functions/`, with shared auth/CORS helpers in `supabase/functions/_shared/` — tested per this section's own testing table below (Deno's test runner for the pure validation logic; `supabase functions serve` + a real manual pass for the actual authorization/Admin-API behavior, the same "prove it against a real session" standard this project applies to every other privilege-bypassing operation).

---

# 13. Repository Contracts

Every Repository implements a plain TypeScript interface — no Supabase types leak through the return values (`architecture.md` §9).

```typescript
interface AuthRepository {
  register(input: { email: string; password: string; fullName: string }): Promise<{ user: Profile; session: Session }>;
  login(input: { email: string; password: string }): Promise<{ user: Profile; session: Session }>;
  logout(): Promise<void>;
  refreshSession(): Promise<{ session: Session }>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: { newPassword: string }): Promise<void>;
  getCurrentUser(): Promise<Profile | null>;
}
// Errors: VALIDATION_ERROR, EMAIL_ALREADY_REGISTERED, INVALID_CREDENTIALS, RATE_LIMITED, SESSION_EXPIRED

interface PropertyRepository {
  list(filters: PropertyFilters, cursor?: string, limit?: number): Promise<{ data: Property[]; meta: CursorMeta }>;
  listFeatured(limit?: number): Promise<Property[]>;
  getBySlug(slug: string): Promise<Property>;
  getById(id: string): Promise<Property>; // Sprint 6 — the agent edit form fetches by id, not slug
  listRelated(input: { propertyId: string; countyId: string; propertyTypeId: string; limit?: number }): Promise<Property[]>;
  create(agencyId: string, input: CreatePropertyInput): Promise<Property>;
  update(id: string, input: Partial<CreatePropertyInput>): Promise<Property>;
  archive(id: string, archived?: boolean): Promise<Property>; // Sprint 6 — bidirectional, `archived: false` un-archives
  updateAvailability(id: string, status: PropertyStatus): Promise<Property>;
  listForAgent(agencyId: string, filters?: AgentPropertyFilters, page?: number, pageSize?: number): Promise<{ data: Property[]; meta: PageMeta }>; // Sprint 6, AGENT-001/002/006 — offset-paginated, distinct from list()'s cursor pagination. `agencyId` is explicit and load-bearing — found via manual testing that RLS's guest-visibility policy (no role restriction) also lets *other* agencies' guest-visible properties through an unscoped query
  incrementViewCount(id: string): Promise<void>; // Sprint 6, AGENT-008
  submitForVerification(id: string): Promise<Property>; // Sprint 6, AGENT-007's agent-facing half — §6.10
}
// Errors: VALIDATION_ERROR, PROPERTY_NOT_FOUND, FORBIDDEN, INVALID_STATE_TRANSITION, STORAGE_ERROR

interface ReferenceDataRepository { // never previously documented here — added post-Sprint-8 alongside its first contract change (createLocation)
  listCounties(): Promise<County[]>;
  listLocations(countyId?: string): Promise<Location[]>;
  listPropertyTypes(): Promise<PropertyType[]>;
  listAmenities(): Promise<Amenity[]>;
  createLocation(countyId: string, name: string): Promise<Location>; // post-Sprint-8 — agent-only (locations_insert_agent, database.md §9); the property form's Location combobox calls this when no existing neighborhood matches what was typed
}
// Errors: VALIDATION_ERROR, FORBIDDEN, CONFLICT (duplicate (countyId, name) — 23505, mapSupabaseError.ts §15.3)

interface PropertyImageRepository {
  listByProperty(propertyId: string): Promise<PropertyImage[]>;
  upload(propertyId: string, file: File, altText?: string): Promise<PropertyImage>;
  delete(imageId: string): Promise<void>;
  reorder(propertyId: string, orderedImageIds: string[]): Promise<PropertyImage[]>;
}
// Errors: VALIDATION_ERROR, PROPERTY_NOT_FOUND, IMAGE_NOT_FOUND, STORAGE_ERROR, FORBIDDEN

interface FavoritesRepository {
  save(propertyId: string): Promise<Favorite>;
  remove(propertyId: string): Promise<void>;
  list(page?: number, pageSize?: number): Promise<{ data: Favorite[]; meta: PageMeta }>;
}
// Errors: UNAUTHENTICATED, PROPERTY_NOT_FOUND

interface ListViewingRequestsInput {
  status?: ViewingStatus[];
  page?: number;
  pageSize?: number;
  sort?: 'requestedDateAsc' | 'requestedDateDesc' | 'createdAtDesc'; // Sprint 5 — one method serves every ordering need (§8.3)
}

interface ViewingRequestRepository { // "BookingRepository"
  create(input: CreateViewingRequestInput): Promise<ViewingRequest>;
  listForCustomer(input?: ListViewingRequestsInput): Promise<{ data: ViewingRequest[]; meta: PageMeta }>;
  listForAgent(input?: ListViewingRequestsInput): Promise<{ data: ViewingRequest[]; meta: PageMeta }>; // Sprint 6, BOOK-001
  reschedule(id: string, input: { requestedDate: string; requestedTime: string }): Promise<ViewingRequest>; // Sprint 6, BOOK-003
  cancel(id: string, reason?: string): Promise<ViewingRequest>; // shared by VIEW-004 (customer) and BOOK-004 (agent, Sprint 6)
  confirm(id: string): Promise<ViewingRequest>; // Sprint 6, BOOK-002
  complete(id: string): Promise<ViewingRequest>; // Sprint 6, BOOK-005
  markNoShow(id: string): Promise<ViewingRequest>; // Sprint 6, BOOK-006
}
// Errors: VALIDATION_ERROR, PROPERTY_NOT_FOUND, PROPERTY_NOT_AVAILABLE, INVALID_STATE_TRANSITION, FORBIDDEN

interface AgentRepository { // Sprint 6, new entities/ slice — resolves "my own agent/agency" for every agent-dashboard feature
  getCurrentAgent(profileId: string): Promise<Agent>;
}
// Errors: AGENT_NOT_FOUND

interface AgencyRepository {
  list(filters?: { county?: string }): Promise<Agency[]>;
  getById(id: string): Promise<Agency>; // Sprint 7 extension — the admin edit form fetches by id, not slug
  getBySlug(slug: string): Promise<Agency>;
  create(input: CreateAgencyInput): Promise<Agency>; // Admin only
  update(id: string, input: Partial<CreateAgencyInput>): Promise<Agency>; // Admin, or own agency's agent for limited fields
}
// Errors: VALIDATION_ERROR, AGENCY_NOT_FOUND, FORBIDDEN

interface VerificationRepository { // Sprint 7, new entities/property-verification/ slice — cross-cutting (the agent's own VerificationStatusPanel reads history(); moderator/admin read all three methods)
  listPending(page?: number, pageSize?: number): Promise<{ data: Property[]; meta: PageMeta }>;
  setStatus(propertyId: string, input: { status: VerificationStatus; reason?: string }): Promise<{ property: Property; verification: PropertyVerification }>;
  history(propertyId: string): Promise<PropertyVerification[]>;
}
// Errors: VALIDATION_ERROR, PROPERTY_NOT_FOUND, FORBIDDEN

interface AdminUserRepository { // Sprint 7, features/admin-users — feature-local (ADR-030), not an extension of ProfileRepository
  list(filters?: { role?: UserRole; isActive?: boolean; q?: string }, page?: number, pageSize?: number): Promise<{ data: Profile[]; meta: PageMeta }>;
  adminUpdate(id: string, input: { role?: UserRole; isActive?: boolean }): Promise<Profile>; // the only path that can change profiles.role
}
// Errors: VALIDATION_ERROR, PROFILE_NOT_FOUND, FORBIDDEN

interface AdminMetricsRepository { // Sprint 7, features/admin-dashboard — feature-local (ADR-030)
  getMetrics(): Promise<{ totalProperties: number; pendingVerifications: number; activeAgencies: number; bookingsThisWeek: number }>;
}

interface AdminAnalyticsRepository { // Sprint 7, features/admin-analytics — feature-local (ADR-030)
  getAnalytics(range: { from: string; to: string }): Promise<{ totalViews: number; viewingRequestsInRange: number; byAgency: { agencyId: string; agencyName: string; listingCount: number }[] }>;
}

interface ActivityLogRepository { // Sprint 7, features/admin-activity-log — feature-local (ADR-030)
  list(filters?: { entityType?: string; entityId?: string; actorId?: string; dateFrom?: string; dateTo?: string }, page?: number, pageSize?: number): Promise<{ data: ActivityLog[]; meta: PageMeta }>;
  delete(id: string): Promise<void>; // Admin only, retention/GDPR purposes
}
// Errors (AdminMetricsRepository/AdminAnalyticsRepository/ActivityLogRepository): FORBIDDEN, DATABASE_ERROR
```

---

# 14. Request Validation

All input validation uses **Zod**, at the Service layer, before a Repository method is ever called (`architecture.md` §10). Schemas below are illustrative of the pattern applied consistently across every operation in §5–§10.

```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Za-z]/, 'Password must include a letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
  fullName: z.string().trim().min(2).max(100),
});

export const CreateViewingRequestSchema = z.object({
  propertyId: z.string().uuid(),
  requestedDate: z.string().refine(
    (val) => new Date(val) >= new Date(new Date().toDateString()),
    'Requested date must be today or later.'
  ),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Enter a valid time (HH:mm).'),
  notes: z.string().max(500).optional(),
});

export const CreatePropertySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  propertyTypeId: z.string().uuid(),
  countyId: z.string().uuid(),
  locationId: z.string().uuid(),
  latitude: z.number().min(-4.9).max(5.5),   // bounding box for Kenya
  longitude: z.number().min(33.9).max(41.9),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  rentAmount: z.number().positive(),
  depositAmount: z.number().nonnegative(),
  amenityIds: z.array(z.string().uuid()).max(20),
  // Added Sprint 6 — AGENT-002's AC lists availability among the fields the
  // creation form captures; this draft originally omitted it. Not part of
  // CreatePropertyInput's Service-resolved additions (agentId/slug, §13) —
  // the agent picks this one directly in the form.
  availabilityStatus: z.enum(['available', 'reserved', 'occupied', 'hidden']),
});
// UpdatePropertySchema = CreatePropertySchema.partial() — AGENT-003's "same rules as creation," applied to whichever fields the edit actually changed.

// Sprint 6, BOOK-003 — mirrors CreateViewingRequestSchema's date/time validation.
export const RescheduleViewingRequestSchema = z.object({
  requestedDate: z.string().refine(
    (val) => new Date(val) >= new Date(new Date().toDateString()),
    'Requested date must be today or later.'
  ),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Enter a valid time (HH:mm).'),
});

export const SetVerificationSchema = z.object({
  status: z.enum(['verified', 'rejected', 'pending_verification']),
  reason: z.string().max(500).optional(),
}).refine(
  (val) => val.status !== 'rejected' || !!val.reason,
  { message: 'A reason is required when rejecting a listing.', path: ['reason'] }
);

// File validation is layered on top of the JSON schema, since Zod parses
// structured data, not binary streams — the File object's metadata is
// validated directly:
export function validatePropertyImageFile(file: File) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new AppError('VALIDATION_ERROR', 'Only JPEG, PNG, or WEBP images are allowed.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new AppError('VALIDATION_ERROR', 'Images must be 5MB or smaller.');
  }
}
```

**Conventions:**
- Required fields have no `.optional()`; optional fields are explicit, never inferred from "empty string is fine."
- Length limits exist on every free-text field — no unbounded `text` input reaches the database without a Zod-enforced ceiling, even though Postgres itself doesn't cap `text` columns.
- Enums in Zod (`z.enum([...])`) are kept in lockstep with the Postgres enum values in `database.md` §6 — the same string literals, so no translation layer is needed between schema validation and the database `CHECK`.
- Custom validators (`.refine()`) express business rules that are shape-valid but semantically wrong (future dates, conditional-required fields) — the same category of rule that also gets a database-level backstop (`database.md` §9) for the highest-stakes cases.

---

# 15. Error Handling

## 15.1 Standard Envelope

Every Repository method either resolves with a `{ success: true, data, meta? }` shape or throws an `AppError`, which every Service/Hook layer catches and re-presents as:

```json
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "This property could not be found. It may have been removed.",
    "details": null
  }
}
```

`details` is populated only for `VALIDATION_ERROR` (a field-path → message map matching the Zod error shape) — never for anything that could leak internal state.

## 15.2 Error Code Taxonomy

| Code | Category | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | Client | Request shape/content failed Zod validation. |
| `UNAUTHENTICATED` | Auth | No valid session present for an operation that requires one. |
| `INVALID_CREDENTIALS` | Auth | Login failed — deliberately generic (§5.2). |
| `SESSION_EXPIRED` | Auth | Refresh token itself is no longer valid. |
| `FORBIDDEN` | Authorization | Authenticated, but not permitted to perform this action on this resource (RLS-backed). |
| `PROPERTY_NOT_FOUND` / `AGENCY_NOT_FOUND` / `VIEWING_REQUEST_NOT_FOUND` / `PROFILE_NOT_FOUND` / `IMAGE_NOT_FOUND` | Not Found | Resource-specific 404 equivalents. |
| `EMAIL_ALREADY_REGISTERED` | Conflict | Registration with a duplicate email. |
| `PROPERTY_NOT_AVAILABLE` | Conflict | Attempted to book a property that isn't `available` (§8.2). |
| `INVALID_STATE_TRANSITION` | Conflict | Attempted an illegal `viewing_requests.status` transition (§8.1); also reused for an agency application that isn't `pending_review` anymore (Epic 12, §25.2). |
| `REVIEW_NOT_ELIGIBLE` | Conflict | Attempted to review a viewing request that isn't the caller's own `completed` booking (Epic 12, §25.3). |
| `RATE_LIMITED` | Throttling | See §18. |
| `STORAGE_ERROR` | Infrastructure | Supabase Storage upload/delete failure. |
| `DATABASE_ERROR` | Infrastructure | An unmapped Postgres error surfaced through PostgREST. |
| `UNEXPECTED_ERROR` | Infrastructure | Anything not otherwise classified — always logged server-side with full detail; the client only ever sees this generic code and message. |

## 15.3 Normalization at the Repository Boundary

| Source | Example | Normalized to |
|---|---|---|
| Postgres `unique_violation` (`23505`) | Duplicate `agencies.slug` | `CONFLICT` (or a resource-specific code where one exists) |
| Postgres `foreign_key_violation` (`23503`) | Referencing a deleted `propertyTypeId` | `VALIDATION_ERROR` |
| Postgres `check_violation` (`23514`) | `rent_amount <= 0` | `VALIDATION_ERROR` |
| RLS policy rejection (PostgREST `42501`/empty result on an owned-row update) | Agent updating another agency's property | `FORBIDDEN` |
| Trigger-raised exception | `prevent_booking_unavailable_property()` | `PROPERTY_NOT_AVAILABLE` |
| Supabase Auth error | Weak password, bad credentials | `VALIDATION_ERROR` / `INVALID_CREDENTIALS` |
| Storage error | Bucket policy rejection, quota | `STORAGE_ERROR` |
| Network/timeout | Supabase unreachable | `UNEXPECTED_ERROR` (with retry, `architecture.md` §16) |

This mapping table lives in exactly one shared utility (`mapSupabaseError()`), used by every Repository — never reimplemented per-repository.

**Mechanism for the `prevent_booking_unavailable_property()` row above (added Sprint 5):** the trigger raises with a dedicated Postgres errcode, `RH001` (`database.md` §9), rather than the default `P0001` — `mapSupabaseError()`'s `POSTGREST_ERROR_CODE_MAP` maps `RH001` directly to `PROPERTY_NOT_AVAILABLE`. This is the general pattern for any trigger whose rejection needs to reach the frontend as a specific typed code: a dedicated errcode, never matching on the raised message text (brittle, locale-fragile).

**`viewingRequestRepository.cancel(id, reason?)`'s not-found case (added Sprint 5):** RLS's `viewing_requests_cancel_own_customer` policy scopes the `UPDATE` to the caller's own rows while `status IN ('pending','confirmed')` — a 0-rows-affected result (PostgREST `PGRST116`) can mean either "not your request" or "already in a terminal state," and RLS deliberately can't distinguish the two (same non-leaking reasoning as `profile.rls.test.ts`'s own-row policies). This normalizes to `INVALID_STATE_TRANSITION`, not `VIEWING_REQUEST_NOT_FOUND` — the Cancel button is only ever shown on a request the customer can already see, so a real hit here is stale client state, not an ownership violation.

**`set_property_verification()`'s not-found case (added Sprint 7):** raises a plain PL/pgSQL `P0002` (`no_data_found`, a standard SQLSTATE) for a nonexistent `property_id` — `mapSupabaseError()` maps `P0002` directly to `PROPERTY_NOT_FOUND`. Considered a new `RH003` custom errcode for the RPC's other failure case ("reason required when rejecting") and deliberately did not add one: that case already raises a standard `23514` (`check_violation`), which already maps to `VALIDATION_ERROR` — the Service-layer Zod schema (`VerificationActionSchema`) catches it first in the normal path regardless, so the DB check is only ever a rare backstop, not a case the frontend needs to distinguish with its own dedicated code the way `RH001`/`RH002` genuinely did.

**`enforce_review_eligibility()`'s rejection (Epic 12, added 2026-08-05):** raises with a dedicated errcode, `RH003` — continuing the `RH001`/`RH002` sequence, since this is exactly the kind of case those two were reserved for (a rejection the frontend genuinely needs to distinguish with its own code, not a generic `23514`/`P0002`). Mapped to `REVIEW_NOT_ELIGIBLE`. `approve_agency_application()`/`reject_agency_application()`'s "not pending anymore" case reuses the existing `RH002` → `INVALID_STATE_TRANSITION` mapping rather than adding a fourth code, since it's semantically identical to that RPC's original use.

**Client-side logging (Sprint 7, `coding-standards.md` §22):** this is a frontend-only SPA with no server tier, so "logged server-side with full detail" above means `shared/lib/logger.ts` — the single logging call site every `console.warn`/`console.error` funnels through (enforced by the `no-console` ESLint rule). `mapSupabaseError()` calls `logger.error()` for the genuinely unexpected `DATABASE_ERROR`/`UNEXPECTED_ERROR` fallthrough cases only (never for expected outcomes like `VALIDATION_ERROR`/`FORBIDDEN`/a resource-specific not-found), with a Postgres errcode or error type in `meta` — never PII. `shared/ui/route-error-boundary.tsx`'s `RouteErrorBoundary` (the one sanctioned class-component exception, `coding-standards.md` §7) does the same for render-time errors, wrapping each top-level layout's `<Outlet/>`/`children`. No Sentry-style integration yet — both are the documented drop-in hook point for one later.

---

# 16. Pagination

Two modes, matching `database.md` §14 exactly — chosen per endpoint based on how the underlying list actually behaves, not applied uniformly.

## 16.1 Cursor (Keyset) Pagination — Public Property Feed

Used by: `GET /properties` (§6.1).

```json
{
  "success": true,
  "data": [ /* Property[] */ ],
  "meta": {
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE1VDEwOjAwOjAwWiIsImlkIjoiM2YyIn0=",
    "hasMore": true
  }
}
```

The cursor is an opaque, base64-encoded pair — clients pass it back verbatim, never construct or inspect it. This avoids the `OFFSET`-degradation problem on the app's highest-traffic query (`database.md` §14) and stays correct even as new properties are inserted while a user scrolls.

**Sprint 3 addendum (2026-07-27):** the pair's *internal* shape generalizes to `{ sortValue, id, sort }` rather than being hardcoded to `{ createdAt, id }` — true keyset pagination requires the cursor tuple to match whichever column the active `ORDER BY` actually sorts on, which breaks the moment a guest picks `sort=price_asc`/`price_desc` (§17, `DISC-004`) instead of the default `newest`. `sortValue` holds `created_at` for `newest` or `rent_amount` for either price sort; `sort` records which one so decoding doesn't have to guess. The external contract is unchanged — still opaque, still passed back verbatim — this only clarifies what's inside it. See `frontend/src/entities/property/cursor.ts`.

## 16.2 Offset Pagination — Bounded Lists

Used by: Favorites (§7.3), Viewing Requests (§8.3/8.4), Admin lists (§9).

```json
{
  "success": true,
  "data": [ /* T[] */ ],
  "meta": { "page": 1, "pageSize": 20, "total": 47, "totalPages": 3 }
}
```

Appropriate here because these lists are small (a customer's bookings, one agent's properties) and benefit from jumpable page numbers (`ui-guidelines.md` §11.16) — the `OFFSET` cost that matters for the public feed never materializes at this scale.

---

# 17. Filtering

Applies primarily to `GET /properties` (§6.1); the same shape informs any future filterable list.

| Filter | Param | Type | Maps to |
|---|---|---|---|
| Location (free text) | `q` | string | GIN full-text index + `ILIKE` on `locations.name`/`counties.name` (`NFR-SEARCH-002`) |
| County | `county` | slug/UUID | `properties.county_id` |
| Property Type | `propertyType` | slug/UUID | `properties.property_type_id` |
| Bedrooms | `bedrooms` | integer (exact) or `bedroomsMin`/`bedroomsMax` | `properties.bedrooms` |
| Bathrooms | `bathrooms` | integer | `properties.bathrooms` |
| Price | `minPrice`, `maxPrice` | number | `properties.rent_amount` range |
| Availability | `availability` | enum | `properties.availability_status` (public callers implicitly restricted to non-hidden rows regardless) |
| Verification | `verification` | enum | `properties.verification_status` (public callers can see `unverified`/`pending_verification`/`verified`, never `rejected` — RLS-enforced) |
| Amenities | `amenities` | comma-separated UUID/slug list | `property_amenities` (`AND` semantics — a property must have *all* listed amenities, not any) |
| Sorting | `sort` | `price_asc` \| `price_desc` \| `newest` | `ORDER BY rent_amount` / `created_at DESC` |
| Searching | `q` | *(same as Location above)* | — |

All filters are combinable simultaneously (`NFR-SEARCH-003`) and are reflected in the browser URL by the calling Hook, not by the Repository (`NFR-SEARCH-004`) — the Repository is a pure function of its filter object regardless of where that object came from.

---

# 18. Rate Limiting

Supabase does not provide general-purpose application-level rate limiting out of the box (beyond Auth's own internal throttling); the recommendations below are enforced via a combination of Cloudflare (already the DNS/CDN layer, `architecture.md` §19) request-rate rules and Service-layer counters backed by Postgres.

| Operation | Recommended Limit | Enforcement Point | Rationale |
|---|---|---|---|
| Login / Register / Password Reset | 5 attempts per 15 minutes, per IP + email combination | Supabase Auth (built-in) + Cloudflare rule | Brute-force and credential-stuffing protection (`SYS-001`). |
| Viewing Request creation | 10 per hour, per customer | Service layer (count recent rows via `viewingRequestRepository`) | Prevents spam bookings from tying up agent queues. |
| Image Upload | 20 per hour, per agent | Service layer | Storage cost/abuse control; well above any legitimate single-listing need (a listing typically has <15 images). |
| Contact Message submission | 5 per hour, per email address | Service layer (`contactMessageRepository.countRecentByEmail()`, backed by the `count_recent_contact_messages_by_email` `security definer` RPC — `database.md` §9's pitfall note explains why a plain SELECT count doesn't work here) | Spam/abuse control on a form reachable by anyone, including guests with no stable account id — keyed by email rather than `user_id` for that reason (§23.1). |
| Search (`GET /properties`) | 60 requests per minute, per IP | Cloudflare rule | Generous enough for real usage and pagination scrolling; blocks basic scraping without hindering renters. |
| Future Public API | Per-API-key daily quota (e.g. 1,000 requests/day on the free tier) | Edge Function gateway (§22) | Standard practice once the API has external consumers who aren't the first-party frontend. |

All rate-limit rejections return `RATE_LIMITED` with a `retryAfterSeconds` hint in `error.details` where the enforcement point can supply one.

**Implementation status (Sprint 8, `roadmap.md` §12):** the two Service-layer counters are built and unit-tested — `viewingRequestService.create()` checks `viewingRequestRepository.countRecentByCustomer()` before the availability/validation checks (cheapest reason to reject first), and `propertyImageService.upload()` checks `propertyImageRepository.countRecentByAgent()` after file-type/size validation. Both throw `RATE_LIMITED` with `retryAfterSeconds` set to the window length. Login/Register/Password Reset is covered by Supabase Auth's own built-in throttling (confirmed via `mapSupabaseError.ts`'s `over_request_rate_limit`/`over_email_send_rate_limit` mappings). The two Cloudflare-rule rows (Search, Future Public API) remain infrastructure configuration, out of this repository's scope.

---

# 19. API Security

| Layer | Mechanism |
|---|---|
| **Authentication** | Supabase Auth issues short-lived JWT access tokens plus a longer-lived refresh token; `supabase-js` attaches the access token as a `Bearer` header automatically — no manual token handling in application code. |
| **Authorization** | Enforced authoritatively by **RLS** (`database.md` §9) — every policy in that document applies unchanged here. Service-layer checks are a UX convenience (fast, specific errors), never the actual security boundary. |
| **RLS** | See `database.md` §9 in full; this document's `FORBIDDEN`/permission columns throughout §5–§10 are a direct restatement of those policies from the API's point of view. |
| **JWT** | `supabase-js`'s default storage handling is used as-is, which persists the session to `localStorage` (resolved in Sprint 2, `AUTH-005`, per the tension FEAT-005 flagged: the SDK's actual default *is* `localStorage`-based, not the absence of it — no custom storage adapter is introduced without a concrete reason to deviate, and none exists yet). Tokens are never logged, including in error reports. |
| **HTTPS** | Enforced end-to-end by Vercel, Supabase Cloud, and Cloudflare (`architecture.md` §19) — no plaintext transport exists in any deployed environment. |
| **Storage security** | Bucket-level RLS policies restrict writes to path-scoped ownership (`database.md` §10); MIME/size validation is enforced at the bucket policy level, not just client-side (§10.1). |
| **Input validation** | Zod at the Service layer (§14) is the first line; Postgres `CHECK` constraints (`database.md` §5) are the backstop that holds even if a Service-layer bug lets bad data through. |
| **Output sanitization** | Rich text (`properties.description`) is sanitized before storage (`requirements.md` §13.2) *and* rendered through React's default escaping on the frontend — defense in depth against stored XSS, not reliance on a single layer. |
| **Least privilege** | Every Repository method requests only the columns it needs (§4, "Relationship expansion" — no `select('*')` beyond what a DTO actually uses); every role's RLS grant is scoped to the narrowest set of rows/columns that satisfies its user stories (`database.md` §9). |

---

# 20. Versioning Strategy

The API described in this document is **internal-only** for the MVP — it is the contract between the frontend and Supabase, not a contract with third parties. Versioning is therefore handled at two different layers:

1. **Repository interfaces (now):** Versioned implicitly through TypeScript. A breaking change to a Repository method's signature is caught at compile time across every call site in the same PR — there is no need for parallel `v1`/`v2` Repository implementations while there is exactly one consumer (this frontend).
2. **Database schema (now):** Migrations are additive-first (`database.md` §13) — new nullable columns and new tables rather than renames/drops — precisely so Repository code doesn't need to change in lockstep with every migration.
3. **A future public API (§22):** If/when Rental Hunt KE exposes an API to external consumers (mobile app under separate release cadence, agency integrations, a public API product), it will be versioned at the URL level through an Edge Function gateway — `/api/v1/...` — sitting in front of the same Repositories. That gateway is the point where "internal API" becomes "public API," and it is the only layer that needs real version negotiation; the Repository/Service/RLS stack underneath remains single-version.

---

# 21. Testing Strategy

| Test Type | Approach |
|---|---|
| **Repository testing** | Unit tests against a thin fake implementing only the subset of the Supabase client interface a given Repository calls (`from().select()...`, `auth.signInWithPassword()`, etc.), asserting the Repository correctly maps rows → DTOs and normalizes errors (§15.3). Fast, no network, no database. |
| **Integration testing** | Run against a local Supabase instance (`supabase start`, `database.md` §13) seeded with known fixtures, exercising **real RLS policies** — this is the only reliable way to catch an RLS bug, since a mocked client can't reproduce Postgres's actual policy evaluation. |
| **Contract testing** | CI regenerates Supabase's TypeScript types (`supabase gen types typescript`) and diffs them against the hand-written DTOs/Zod schemas in this document (§3.1, §14); a mismatch fails the build, catching schema drift before it reaches a Repository silently returning `undefined` for a renamed column. |
| **Edge Function testing** | Local: `supabase functions serve` + Deno's test runner for unit-level logic (e.g. the notification payload builder). CI: a smoke test invoking the deployed staging function end-to-end after every deploy. |
| **Mocking Supabase** | Reserved for Repository-level error-mapping tests (§15.3) where a real database isn't needed to exercise the logic. Anything touching RLS, triggers, or actual query correctness uses the local Supabase instance instead of a mock — mocks cannot fail an RLS check, so they cannot catch the bugs that matter most here. |

---

# 22. Future Expansion

| Direction | How this API design accommodates it |
|---|---|
| **Mobile applications** (`FUT-006`) | The Service/Repository layer is plain TypeScript with no DOM dependency; it can be extracted into a shared package consumed by a React Native client calling the same Supabase project, with only the Hook layer (and its TanStack Query bindings) needing a mobile-appropriate replacement. |
| **Public API** | An Edge Function gateway at `/api/v1/...` (§20) fronts the existing Repositories, adding API-key auth and per-key rate limiting (§18) without touching RLS or the internal Service layer. |
| **Agency integrations** | Outbound webhooks (e.g. `property.verified`, `viewing.confirmed`) can be added as a thin Edge Function subscribing to the same database webhooks already used internally (§12), without new schema. |
| **M-Pesa (`FUT-001`)** | A `payments` resource (sketched in `database.md` §15) plus a `daraja-webhook` Edge Function to receive M-Pesa callbacks — the pattern already established for `send-booking-notifications` (§12) extends directly. |
| **Notifications (`FUT`)** | The `notifications` table sketch in `database.md` §15 pairs with the `notification-dispatch` Edge Function pattern (§12) and a new realtime channel (§11) — additive across every layer. |
| **AI recommendations (`FUT-005`)** | A `recommendations` cache table (`database.md` §15) fed by a scheduled Edge Function consuming `favorites`/`activity_logs`/search history, exposed through a new `recommendationRepository.listForCustomer()` method — the rest of the stack is unaffected. |
| **Premium subscriptions (`FUT-003`)** | A `subscriptions` resource gates `properties.is_featured` (already a real column, `database.md` §5.8) behind an active-subscription check inside the existing `set_property_verification`-style RPC pattern, rather than requiring a new authorization mechanism. |

---

# 23. Contact API

Added 2026-08-05 (`CONTENT-002`/`003`, `user-stories.md` Epic 11; `database.md` §5.16; ADR-034). No dedicated top-level "Public API" section existed for a guest-facing form outside Property/Favorites/Viewing Request, so this is a new section rather than a subsection of one of those.

## 23.1 Submit Contact Message

| | |
|---|---|
| **Method / Route** | `POST /contact-messages` |
| **Repository Function** | `contactMessageRepository.submit(input: { name, email, message }): Promise<void>` (`entities/contact-message`) |
| **Permissions** | Guest, Customer, Agent, Moderator, Admin — anyone. `user_id` is set server-side from the caller's session (`NULL` for a guest), never client-supplied. |
| **Validation** | Zod at the Service layer (`features/contact`): `name` non-blank, `email` a valid address, `message` 10–2000 characters. Backed by the same `CHECK` constraints at the DB layer (`database.md` §5.16). |
| **Notes** | Returns `void`, not the created row — see `database.md` §9's pitfall notes. No role but admin can read this table, including the submitter's own row, so the Repository never chains `.select()` after `.insert()`; the rate-limit count above goes through a `security definer` RPC for the same underlying reason. |
| **Rate Limiting** | 5 submissions per hour, per email address (§18) — the Service layer counts recent rows via `contactMessageRepository.countRecentByEmail()` before validation, mirroring `viewingRequestService.create()`'s existing pattern. |
| **Errors** | `VALIDATION_ERROR`, `RATE_LIMITED` |

## 23.2 List Contact Messages (Admin)

| | |
|---|---|
| **Method / Route** | `GET /contact-messages` |
| **Repository Function** | `contactMessageRepository.list(filters?: { isResolved?: boolean })` (`entities/contact-message`) |
| **Permissions** | Admin only. |
| **Notes** | Newest-first, unlike the Verification Queue's oldest-first (there's no fairness concern here — a support queue is read by whoever's triaging it, not competed over). |

## 23.3 Resolve / Unresolve Contact Message (Admin)

| | |
|---|---|
| **Method / Route** | `PATCH /contact-messages/:id` |
| **Repository Function** | `contactMessageRepository.setResolved(id, isResolved: boolean)` (`entities/contact-message`) |
| **Permissions** | Admin only. |
| **Errors** | `FORBIDDEN` |

## 23.4 Delete Contact Message (Admin)

| | |
|---|---|
| **Method / Route** | `DELETE /contact-messages/:id` |
| **Repository Function** | `contactMessageRepository.delete(id)` (`entities/contact-message`) |
| **Permissions** | Admin only. |
| **Errors** | `FORBIDDEN` |

`entities/contact-message` (not a `features/` slice) per the ADR-026/028 "2+ real consumers" test — `features/contact`'s public submission and `features/admin-messages`'s review screen are two independent consumers of the same repository.

---

# 24. Claude Code Implementation Rules

1. **Never call Supabase directly from a React component.** Every data access goes through a Hook → Service → Repository chain (§2.1). A `supabase.from(...)` or `supabase.auth.*` call appearing inside `pages/`, `widgets/`, `features/*/components`, or `shared/ui` is a defect.
2. **Always go through the Repository defined for that resource.** If an operation isn't in §13, extend the relevant Repository interface first — don't reach for a raw Supabase call as a shortcut, even "just this once."
3. **Always validate input with Zod at the Service layer** before calling a Repository method (§14) — never rely on the database `CHECK` constraint alone to catch a bad request; the user deserves a specific, fast error, not a generic 500.
4. **Always return typed, camelCase domain objects from Repositories** (§3.1) — never let a raw `snake_case` Supabase row or a PostgREST error object escape the Repository boundary.
5. **Always handle loading, empty, and error states explicitly** in the Hook/Component that consumes a Repository call, per `architecture.md` §16 and `ui-guidelines.md` §11.18/§19 — a screen that only handles the success path is incomplete, not "MVP-acceptable."
6. **Never duplicate API logic.** If two features need the same data operation, they call the same Repository method — extend or parameterize it rather than writing a second near-identical query.
7. **Use TanStack Query for all server state**, with query keys namespaced by resource and parameters (e.g. `['properties', 'list', filters]`, `['viewing-requests', 'mine']`) so cache invalidation (including from Realtime events, §11) is precise and predictable.
8. **Keep business logic in Services, not Repositories or Components.** Repositories only perform data access and error normalization; Services own validation orchestration, permission-adjacent UX decisions ("is this transition even worth attempting"), and multi-step workflows (e.g. upload image → create metadata row, §10.1).
9. **Verification-status and availability-guarded writes go through the documented RPCs** (`set_property_verification`, the booking-availability trigger) — never a direct `UPDATE`/`INSERT` on `properties`/`viewing_requests` for those specific fields, even from a Service, since RLS and triggers are the actual authority (§2.2, `database.md` §9).
10. **Every new endpoint gets a corresponding entry in this document** (route, repository function, request/response shape, permissions, errors) in the same change that implements it — this document decays the moment implementation outruns it.

---

# 25. Agency Marketplace API

Added 2026-08-05 (`user-stories.md` Epic 12; `database.md` §5.3/§5.17; `decisions.md` ADR-035/ADR-036) — self-service agency onboarding, the public Agency Profile Page, and reviews/ratings, built ahead of `FUT-002`'s original deferred placement.

## 25.1 Apply For Agency (Self-Service)

| | |
|---|---|
| **Method / Route** | `POST /agencies` (self-service variant) |
| **Repository Function** | `agencyRepository.applySelf(input: ApplyForAgencyInput): Promise<Agency>` (`entities/agency`) |
| **Permissions** | Customer only (RLS `agencies_insert_self`). |
| **Validation** | Zod at the Service layer (`features/agency-registration`): same shape as admin's `CreateAgencySchema` plus `socialLinks` (each key an optional URL). |
| **Notes** | `onboardingStatus`/`isActive`/`appliedBy` are never part of the input — `enforce_agency_onboarding_status()` (`database.md` §5.3) forces `pending_review`/`false`/`auth.uid()` server-side regardless of what's sent. |
| **Errors** | `VALIDATION_ERROR` |

## 25.2 Approve / Reject Agency Application (Admin)

| | |
|---|---|
| **Method / Route** | `POST /agencies/:id/approve`, `POST /agencies/:id/reject` |
| **Repository Function** | `agencyRepository.approve(id): Promise<Agency>` / `agencyRepository.reject(id, reason): Promise<Agency>` (`entities/agency`), wrapping the `approve_agency_application()`/`reject_agency_application()` RPCs. |
| **Permissions** | Admin only — not moderator (Agencies management has never been part of the moderator route group). |
| **Notes** | Approval is atomic: activates the agency, promotes the applicant's `profiles.role` to `agent`, and inserts their `agents` row in the same RPC transaction. Reject requires a non-blank `reason`. |
| **Errors** | `FORBIDDEN`, `INVALID_STATE_TRANSITION` (application isn't `pending_review` anymore, reused from §8's `RH002`), `VALIDATION_ERROR` (reject with no reason). |

## 25.3 Reviews

| | |
|---|---|
| **Method / Route** | `POST /reviews`, `GET /agencies/:id/reviews`, `GET /agencies/:id/rating-summary`, `GET /agents/:id/rating-summary` |
| **Repository Function** | `reviewRepository.create(input)`, `.listForAgency(agencyId, page?, pageSize?)`, `.listForAgent(agentId, page?, pageSize?)`, `.getAgencyRatingSummary(agencyId)`, `.getAgentRatingSummary(agentId)` (`entities/review`) |
| **Permissions** | Create: Customer only, own row, own completed viewing. List/summary: everyone, including guests (`deleted_at IS NULL` rows only). |
| **Validation** | Zod at the Service layer (`features/reviews`): `rating` integer 1–5, `comment` optional (max 2000 chars). `viewingRequestId` is the only trust-relevant input — `agencyId`/`agentId`/`propertyId` are never accepted from the client; `enforce_review_eligibility()` (`database.md` §5.17) derives them server-side. |
| **Pagination** | Offset (§16.2), 10 rows per page — same convention as the new admin drill-down lists below. |
| **Errors** | `VALIDATION_ERROR`, `REVIEW_NOT_ELIGIBLE` (`RH003` — not the caller's own completed viewing), `CONFLICT` (already reviewed this viewing — `23505` on `viewing_request_id`'s unique constraint). |

## 25.4 Agency Profile Page's Property/Agent Lists

| | |
|---|---|
| **Method / Route** | `GET /properties?agencyId=:id` (reuses the public feed), `GET /agencies/:id/agents` |
| **Repository Function** | `propertyRepository.list({ agencyId }, cursor?, limit?)` — `agencyId` is simply a new optional filter on the existing public method, not a separate one, so it inherits all of `list()`'s cursor/sort/amenity/search logic for free (`entities/property`). `agentRepository.listByAgency(agencyId)` reads the `agent_directory` security-definer view (`database.md` §9), not the raw `agents` table — guests have no direct SELECT grant there. |
| **Permissions** | Public — same guest-visibility rules as the main search feed / `PROP-005`'s Agent Card. |
| **Pagination** | Properties: cursor (§16.1), matching the main feed. Agents: unpaginated (an agency's active agent count is small; add pagination only if that assumption stops holding). |

## 25.5 Admin Overview Drill-Downs

| | |
|---|---|
| **Method / Route** | `GET /admin/properties`, `GET /admin/bookings` |
| **Repository Function** | `propertyRepository.listAllAdmin(page?, pageSize?)`, `viewingRequestRepository.listAllAdmin(page?, pageSize?)` — unscoped by agency, mirroring `getByIdAdmin()`'s existing precedent that admin/moderator RLS already grants full visibility. |
| **Permissions** | Admin/moderator (RLS `properties_select_all_moderator_admin`, admin/moderator "SELECT all" on `viewing_requests`). |
| **Pagination** | Offset (§16.2), 10 rows per page (per the Admin Overview stat cards' own drill-down requirement — deliberately not matching `AdminActivityLogPage`'s pre-existing 20-per-page, since this was an explicit, separate instruction). |

---

This document is the single source of truth for Rental Hunt KE's API contract. It should be updated alongside any new Repository method, Edge Function, or schema change, and kept consistent with `requirements.md`, `user-stories.md`, `architecture.md`, `database.md`, and `ui-guidelines.md` as the product evolves.
