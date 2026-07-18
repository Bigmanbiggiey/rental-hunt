# Rental Hunt KE - Architecture Decision Records

> **Version:** 1.0
> **Status:** Active (living index — new ADRs appended, never renumbered or deleted)
> **Owner:** Engineering
> **Related Documents:** All ten `docs/*.md` files and [CLAUDE.md](../CLAUDE.md)

---

# 1. Purpose

An Architecture Decision Record (ADR) captures a significant decision, the alternatives that were actually considered, why the chosen option won, and — critically — when it would be worth reopening. This document exists because Rental Hunt KE is built across many sessions with an AI collaborator that has no memory of a prior conversation unless it's written down (`CLAUDE.md` §1). Without this file, a future session has no way to distinguish "this was carefully decided against a real alternative" from "this is just how it happened to be built" — and will burn time re-litigating settled questions, or worse, silently "fix" something that was deliberately built that way.

**This document exists to:**
- Preserve the *reasoning* behind a decision, not just the decision itself — `database.md`, `api-design.md`, and `coding-standards.md` already record *what* was decided; this file records *why*, what else was considered, and what would change the answer.
- Prevent re-litigating settled decisions without a genuine reason — an accepted ADR is binding (`CLAUDE.md` §14) until formally superseded, not until someone forgets why it was made.
- Give every future session — human or AI — a fast way to check "has this already been decided?" before proposing something new.

**When to add a new ADR:** whenever a decision meets any of the following —
- It affects architecture, schema, API contract, or core tooling choice.
- It would be costly or disruptive to reverse later.
- A real alternative was seriously considered and rejected.
- A future reader would reasonably ask "why was it done this way?" and the answer isn't obvious from the code alone.

A decision that's easily reversible, purely cosmetic, or has no real alternative worth recording (e.g. which exact spacing value to use) does not need an ADR — that level of detail belongs in `coding-standards.md`/`ui-guidelines.md` instead.

---

# 2. Decision Log

| ADR | Title | Status | Date | Related Docs |
|---|---|---|---|---|
| [ADR-001](#adr-001-documentation-driven-engineering) | Documentation-Driven Engineering | Accepted | 2026-07-17 | `coding-standards.md` §1, `CLAUDE.md` §1 |
| [ADR-002](#adr-002-react--typescript--vite-selected-as-frontend-stack) | React + TypeScript + Vite selected as frontend stack | Accepted | 2026-07-17 | `architecture.md` §4 |
| [ADR-003](#adr-003-tailwind-css-v4--shadcnui-selected-for-ui) | Tailwind CSS v4 + shadcn/ui selected for UI | Accepted | 2026-07-17 | `ui-guidelines.md` §11/§14 |
| [ADR-004](#adr-004-supabase-selected-as-backend-platform) | Supabase selected as backend platform | Accepted | 2026-07-17 | `architecture.md` §4/§9/§11 |
| [ADR-005](#adr-005-feature-sliced-design-architecture) | Feature-Sliced Design architecture | Accepted | 2026-07-17 | `architecture.md` §5, `coding-standards.md` §3 |
| [ADR-006](#adr-006-repository-pattern-with-service-layer) | Repository Pattern with Service Layer | Accepted | 2026-07-17 | `architecture.md` §9, `api-design.md` §2 |
| [ADR-007](#adr-007-supabase-row-level-security-for-authorization) | Supabase Row Level Security for authorization | Accepted | 2026-07-17 | `database.md` §9 |
| [ADR-008](#adr-008-agency-first-ownership-model) | Agency-first ownership model | Accepted | 2026-07-17 | `database.md` §4.2/§5.3/§5.4 |
| [ADR-009](#adr-009-property-verification-workflow) | Property verification workflow | Accepted | 2026-07-17 | `database.md` §5.15/§9 |
| [ADR-010](#adr-010-roles-implemented-using-postgresql-enum-with-metadata-table) | Roles implemented using PostgreSQL enum with metadata table | Accepted | 2026-07-17 | `database.md` §2/§6 |
| [ADR-011](#adr-011-composite-primary-keys-for-pure-junction-tables) | Composite primary keys for pure junction tables | Accepted | 2026-07-17 | `database.md` §2/§5.11/§5.12 |
| [ADR-012](#adr-012-business-rules-enforced-in-both-service-layer-and-database) | Business rules enforced in both Service Layer and Database | Accepted | 2026-07-17 | `database.md` §9, `api-design.md` §2 |
| [ADR-013](#adr-013-openstreetmap-selected-instead-of-google-maps) | OpenStreetMap selected instead of Google Maps | Accepted | 2026-07-17 | `architecture.md` §14 |
| [ADR-014](#adr-014-documentation-first-development-workflow) | Documentation-first development workflow | Accepted | 2026-07-17 | `roadmap.md` §2/§4 |
| [ADR-015](#adr-015-task-based-ai-development-workflow) | Task-based AI development workflow | Accepted | 2026-07-17 | `CLAUDE.md` §4/§17 |
| [ADR-016](#adr-016-github--vercel-deployment-strategy) | GitHub + Vercel deployment strategy | Accepted | 2026-07-17 | `architecture.md` §19 |
| [ADR-017](#adr-017-current-mvp-scope) | Current MVP scope | Accepted | 2026-07-17 | `vision.md`, `requirements.md` §16 |
| [ADR-018](#adr-018-future-extensibility-strategy) | Future extensibility strategy | Accepted | 2026-07-17 | `database.md` §15, `api-design.md` §22 |

---

## ADR-001: Documentation-Driven Engineering

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** Rental Hunt KE is built under Documentation-Driven Engineering — every product, architectural, and engineering decision is written down and approved in `docs/*.md` before the corresponding code is implemented, and that documentation is treated as binding rather than advisory.

**Context:** The project is built by a solo developer collaborating with an AI coding assistant that has no memory across sessions. There is no second engineer to catch drift in review.

**Options Considered:**
1. Code-first, document later (or not at all) — the default for most small/solo projects.
2. A lightweight README plus inline comments, no formal `docs/` set.
3. Full Documentation-Driven Engineering: a complete, cross-referenced documentation set plus a binding operating manual (`CLAUDE.md`), authored before Sprint 1 code.

**Decision Drivers:** AI sessions cannot rely on conversation memory to stay consistent; a solo developer needs a substitute for the review a team would normally provide; the cost of an inconsistency compounds the more code is written against it.

**Rationale:** Option 3 was chosen because the failure mode of options 1 and 2 — an AI session inventing a slightly different pattern each time it's not sure — is exactly what this project's development model is most exposed to. Writing the rules down converts "hopefully consistent" into "checkable."

**Consequences:** Ten documents plus `CLAUDE.md` and `project-state.md` were written before any application code existed (`roadmap.md` Sprint 0).

**Trade-offs:** Slower time-to-first-code, in exchange for a foundation later sprints can build on without hitting an undocumented or contradictory decision mid-implementation.

**When To Revisit:** If a second human engineer joins the project — a team provides some of the consistency-enforcement this practice exists to substitute for, though the discipline would likely still be valuable at reduced volume, not abandoned outright.

**Related Documents:** `coding-standards.md` §1, `CLAUDE.md` §1, `roadmap.md` §2.

---

## ADR-002: React + TypeScript + Vite selected as frontend stack

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The frontend is built with React 19, TypeScript, and Vite — a client-rendered SPA, not a server-rendered framework.

**Context:** Rental Hunt KE needs a mobile-first, fast-loading, type-safe frontend (`branding.md`, `requirements.md` §13.1), and Supabase already serves as the entire backend, removing any need for a framework that also runs server-side API routes.

**Options Considered:**
1. Next.js (React with SSR/SSG and its own API routes).
2. React + Vite as a pure client-rendered SPA.
3. Vue or Svelte (different framework ecosystem entirely).
4. Angular.

**Decision Drivers:** No server-side rendering requirement exists since Supabase provides the backend directly; Vite's dev-server speed and simpler mental model fit a solo-developer workflow; React has the deepest ecosystem overlap with the other chosen tools (TanStack Query, React Hook Form, shadcn/ui) and the broadest AI-code-generation familiarity, reducing the risk of an AI assistant producing unfamiliar or inconsistent patterns.

**Rationale:** Next.js's SSR/API-route capability solves a problem this project doesn't have (Supabase is already the API layer) at the cost of real added complexity (server/client component boundaries, deployment model). A plain Vite SPA is simpler and sufficient.

**Consequences:** Property detail pages are not server-rendered, which may affect SEO and social-share link-preview quality (`ui-guidelines.md` §12.13's Share Button).

**Trade-offs:** Simplicity and a smaller mental model vs. Next.js's SEO/SSR benefits, which aren't needed to validate the MVP hypothesis (`vision.md`).

**When To Revisit:** If organic search or social-share traffic becomes a measurable, important acquisition channel and client-rendered meta tags prove insufficient — migrating to Next.js or adding a prerendering layer at that point would be a deliberate, ADR-worthy change, not an incidental one.

**Related Documents:** `architecture.md` §4, `coding-standards.md` §6/§7.

---

## ADR-003: Tailwind CSS v4 + shadcn/ui selected for UI

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** All styling uses Tailwind CSS v4 utilities; all interactive components are built on shadcn/ui (Radix-backed) primitives, copied into the repository rather than installed as an opaque dependency.

**Context:** The platform needs WCAG 2.2 AA accessibility (`requirements.md` §13.4) and a specific brand palette (`branding.md`'s Deep Blue/Emerald Green) without the cost of building an accessible component library from scratch.

**Options Considered:**
1. A pre-styled component library (Material UI, Chakra UI).
2. Tailwind CSS v4 + shadcn/ui.
3. Fully custom CSS and components, built from scratch.
4. CSS-in-JS (styled-components/Emotion).

**Decision Drivers:** Need Radix-level accessibility guarantees out of the box; need full visual control to match a specific, non-generic brand palette without fighting a pre-themed library's defaults; need to avoid CSS-in-JS runtime overhead against the performance budget (`requirements.md` §13.1); shadcn/ui's copy-in-code model avoids vendor lock-in and lets components become genuinely owned, customizable code (`coding-standards.md` §14).

**Rationale:** MUI/Chakra would have been faster to start with but harder to reskin away from their own default visual language; a fully custom build would cost far more time to reach the same accessibility guarantees shadcn/ui provides immediately via Radix.

**Consequences:** Every shadcn component copied into `shared/ui` becomes owned code with no automatic upstream security/accessibility patch stream — mitigated by `coding-standards.md` §14's "wrap, don't modify vendor internals" rule.

**Trade-offs:** More per-component setup than a batteries-included library, in exchange for full visual control and a materially smaller bundle.

**When To Revisit:** If the number of copied shadcn primitives grows large enough that manually tracking upstream fixes becomes a genuine maintenance burden — unlikely at MVP scale.

**Related Documents:** `ui-guidelines.md` §11/§14, `coding-standards.md` §13/§14.

---

## ADR-004: Supabase selected as backend platform

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) is the sole backend platform.

**Context:** The domain (agencies → agents → properties → viewing requests, with real referential integrity and five distinct authorization roles) is inherently relational, and the project has a solo developer with no dedicated ops capacity.

**Options Considered:**
1. **Firebase** (Firestore + Auth + Storage).
2. **A custom backend** (e.g. Node/Express + self-managed PostgreSQL).
3. **Supabase** (managed PostgreSQL + Auth + Storage + Realtime + Edge Functions).

**Decision Drivers:**
- **Data model fit:** the domain's relationships (`database.md` §7) — a property has exactly one agency, one currently-assigned agent, many images, many amenities, many viewing requests — are a natural fit for a relational schema with real foreign keys and joins. Firestore's document model would require denormalizing this relational structure and re-implementing referential integrity in application code, directly working against `database.md` §2's "strong referential integrity" and "3NF where appropriate" principles.
- **Authorization model fit:** five roles each needing row-scoped access (`database.md` §9) map cleanly onto Postgres RLS — a declarative, database-enforced, testable authorization layer. Firestore's security-rules language and a custom backend's hand-rolled middleware are both less auditable and harder to integration-test than real RLS policies against a real local database.
- **Solo-developer ops burden:** a custom backend requires building and operating auth, migrations, file storage, and realtime from scratch. Supabase provides all of it managed, letting the solo developer spend time on product code instead of infrastructure.
- **Cost predictability and lock-in:** Firestore's per-document-read pricing is difficult to predict for a search/browse-heavy listing platform and can spike with usage; Supabase's tiers are more predictable, and — since Supabase is open-source — self-hosting remains a real exit ramp a proprietary Firestore data model doesn't offer.
- **Portability:** Postgres and SQL are widely known, standard technology; migrating away from Supabase later is far more tractable than migrating off a proprietary NoSQL data model, and the Repository pattern (ADR-006) further insures against this.

**Rationale:** Firebase would have offered a slightly more "serverless-native" realtime story for a purely document-shaped app, but this app is not document-shaped — it is relational, and forcing it into Firestore would mean re-inventing the referential integrity and RLS-style authorization Postgres already provides natively. A custom backend would offer maximum control but at an ops cost this project's solo-developer model cannot absorb before launch.

**Consequences:** The codebase is coupled to Supabase-specific mechanisms (RLS policy syntax, Supabase Auth flows, PostgREST query conventions) — this coupling is deliberately isolated to the Repository layer (ADR-006) rather than spread throughout the app.

**Trade-offs:** Less "serverless-native" simplicity than Firebase for the realtime feature specifically, in exchange for correct relational integrity, real RLS, predictable cost, and an open-source exit ramp.

**When To Revisit:** If Rental Hunt KE outgrows Supabase Cloud's available scaling tiers, or if a fundamentally different access pattern (e.g. a very high-traffic public API product) emerges post-MVP — at that point, self-hosting Supabase or migrating specific hot paths to a dedicated service becomes the natural next step, and the Repository pattern is what makes that tractable rather than a rewrite.

**Related Documents:** `architecture.md` §4/§9/§11, `database.md` (throughout), `api-design.md` §2.

---

## ADR-005: Feature-Sliced Design architecture

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The frontend is organized using Feature-Sliced Design (`app/pages/widgets/features/entities/shared`) with a strict, lint-enforced downward import direction.

**Context:** The codebase is built incrementally across ten sprints by an AI-assisted solo developer with no team available to catch a misplaced file or an improvised new pattern by inspection alone.

**Options Considered:**
1. Traditional folder-by-type (`components/`, `hooks/`, `services/` as flat top-level folders).
2. Atomic Design (atoms/molecules/organisms).
3. Feature-Sliced Design, with an explicit, enforced import-direction rule.

**Decision Drivers:** Predictable file placement for a context-free AI session; an enforceable (not just documented) rule against circular dependencies and feature-to-feature coupling; a structure that scales toward the Future items in `api-design.md` §22 without requiring a later restructuring project.

**Rationale:** FSD's layers map directly onto this domain's actual shape (entities = Property/Agency/Agent; features = Favorites/ViewingRequests/PropertySearch), and — unlike Atomic Design, which is UI-only and says nothing about business logic placement — FSD's rule can be enforced by a lint rule (`coding-standards.md` §3.3), which matters more here than in a team setting since there's no reviewer to catch a violation by eye.

**Consequences:** More directory ceremony per feature than a flat structure; a new session (human or AI) has to learn the layer vocabulary before contributing correctly — mitigated by `architecture.md` §5 and `coding-standards.md` §3 both documenting it in full.

**Trade-offs:** Structural overhead the project doesn't strictly need at its current small scale, in exchange for scaling predictably as the ten-epic MVP (and beyond) is built out.

**When To Revisit:** If the application's feature count stays small enough that the layering overhead clearly outweighs its benefit — unlikely given the roadmap's scope, but worth reassessing if MVP scope were ever cut drastically.

**Related Documents:** `architecture.md` §5, `coding-standards.md` §3.

---

## ADR-006: Repository Pattern with Service Layer

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** All Supabase access goes through Repositories (pure data access); all business logic goes through Services (validation, workflow orchestration); components/hooks never call Supabase directly.

**Context:** The app needs a place for business rules (booking-availability checks, verification-authority restrictions) that is neither a UI component nor scattered Supabase calls.

**Options Considered:**
1. Call Supabase directly from components/hooks — simplest, least code.
2. A single generic per-resource hook with business logic inlined.
3. Separate Repository (data access) and Service (business logic) layers, both hidden behind Hooks.

**Decision Drivers:** Testability — a Repository/Service with no React dependency is trivially unit-testable (`coding-standards.md` §19); migration insurance — swapping Supabase later touches only Repositories (`architecture.md` §9); single responsibility — data access and business rules change for different reasons and shouldn't live in the same file.

**Rationale:** Option 1 would scatter the same query logic (and the same bugs) across every component that needs it; option 2 conflates two concerns that this domain's real business rules (e.g. the viewing-request state machine, `api-design.md` §8.1) show clearly need to be separable.

**Consequences:** More files per feature (a Repository, a Service, and a Hook, versus one hook doing everything) — accepted as the cost of testability and separation of concerns.

**Trade-offs:** More indirection for genuinely simple CRUD than a direct-call approach, judged worth it given how many real business rules this domain has that would otherwise leak into components.

**When To Revisit:** Not anticipated — this is a foundational, low-risk pattern. It would only be reconsidered if this chain were empirically shown to slow down simple feature delivery without a corresponding benefit, which isn't expected.

**Related Documents:** `architecture.md` §9, `api-design.md` §2/§10/§11/§13, `coding-standards.md` §10/§11.

---

## ADR-007: Supabase Row Level Security for authorization

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** RLS is the sole authority for authorization. Service-layer permission checks exist only for fast, user-friendly errors — never as the actual security boundary.

**Context:** Five roles (Guest, Customer, Agent, Moderator, Admin) need row-scoped access to shared tables — an agent must see only their own agency's properties, a customer only their own bookings.

**Options Considered:**
1. Application-layer authorization only (checked in Services before every query).
2. Database-layer RLS as the sole authority, with Service-layer checks as a UX convenience layer on top.
3. A hybrid with no single designated authority.

**Decision Drivers:** `architecture.md` §7's principle that "the frontend must never rely solely on hidden UI elements to enforce permissions" extends naturally to application code as well — a Service-layer-only rule is not a guarantee, since a bug, a skipped code path, or a direct API call would silently bypass it with no backstop. RLS enforced at the database level holds regardless of what called it.

**Rationale:** Option 2 was chosen because it's the only one where a single bug in application code cannot become a full authorization bypass — the database itself refuses the unauthorized row, every time, regardless of which layer above it might have failed to check.

**Consequences:** RLS policies require real, deliberate design (`database.md` §9's `current_role()`/`current_agency_id()` helpers, the `set_property_verification()` RPC pattern) and real integration testing against a local Supabase instance (`coding-standards.md` §19) — not something a mock can verify.

**Trade-offs:** RLS is less familiar to debug than plain application code for a developer newer to Postgres, accepted given the materially stronger guarantee.

**When To Revisit:** If RLS policy complexity becomes a genuine, ongoing development bottleneck — the existing mitigation (mandatory RLS integration tests) is designed to surface this early rather than requiring the decision itself to be revisited.

**Related Documents:** `database.md` §9, `api-design.md` §19, `coding-standards.md` §21.

---

## ADR-008: Agency-first ownership model

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** Properties belong to Agencies (`properties.agency_id`, `ON DELETE RESTRICT`); Agents (`properties.agent_id`) are the currently-assigned day-to-day manager, a distinct and reassignable relationship.

**Context:** `requirements.md` and `vision.md` describe agents operating on behalf of trusted agencies, not as independent operators.

**Options Considered:**
1. Agent-first ownership — a property belongs directly to an individual agent, with agency as a secondary label.
2. Agency-first ownership — a property belongs to an agency; an agent is assigned as manager but the agency is the accountable owner.
3. No agency concept — flat agent-to-property ownership.

**Decision Drivers:** **Trust/accountability** — `branding.md`'s "trust first" promise and `vision.md`'s "trusted local agents" framing point to the agency, not an individual, as the durable entity a renter can hold accountable, matching how the Kenyan rental market actually operates. **Continuity** — if an individual agent leaves, an agent-first model would orphan their entire property portfolio and verification history; an agency-first model survives agent turnover cleanly. **Future extensibility** — both `FUT-002` (agency self-service onboarding) and `FUT-004` (multi-agency support) assume the agency is the first-class organizational unit.

**Rationale:** Option 3 was rejected outright as contradicting the brand's trust promise. Option 1 was rejected because it makes agent turnover a data-integrity event rather than a routine reassignment.

**Consequences:** Every property carries two foreign keys to track (owning agency + currently-assigned agent) rather than one; reassigning a property's managing agent is a distinct, supported operation, separate from (and simpler than) transferring a property between agencies, which remains out of MVP scope.

**Trade-offs:** More schema complexity than a flat ownership model, in exchange for correctly modeling accountability and surviving agent turnover.

**When To Revisit:** If real usage data shows the overwhelming majority of agencies are single-agent operations, making the two-table split overhead without much practical benefit — worth reassessing post-launch with real data, not before.

**Related Documents:** `database.md` §4.2/§5.3/§5.4/§5.8/§7, `user-stories.md` Epic 6.

---

## ADR-009: Property verification workflow

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** Every property carries a manually-reviewed verification status (`unverified` / `pending_verification` / `verified` / `rejected`), with every transition recorded in a dedicated, append-only `property_verifications` history table — not just a mutable status column or a generic audit log entry.

**Context:** `requirements.md` FR-DASH-010/011 requires this workflow; only `verified` listings may be featured, directly backing `branding.md`'s "trust first" promise.

**Options Considered:**
1. No formal verification — rejected outright as contradicting the platform's core brand promise.
2. Automated verification via a third-party data source (e.g. a land-registry API) — rejected as unavailable/out of MVP budget and timeline.
3. Manual review by a Moderator/Admin, with status changes recorded only in the generic `activity_logs` table.
4. Manual review, with status changes recorded in a dedicated, typed `property_verifications` table.

**Decision Drivers:** `branding.md`'s promise that "the listing information is accurate" and "the assigned agent is legitimate" requires a real human review step, since no automated verification source was assumed available for MVP; auditability requires knowing *who* verified *what*, *when*, with what prior/new status — a requirement richer than a mutable column alone can satisfy, and a requirement frequent/structured enough (time-to-verify reporting, per-moderator throughput) to outgrow a generic `jsonb` log entry.

**Rationale:** Option 4 was adopted after option 3 was initially planned and then explicitly reconsidered during database design — verification is high-volume and reported-on enough to deserve typed `previous_status`/`new_status`/`reviewed_by` columns, not an opaque metadata blob.

**Consequences:** A new listing is not publicly trusted (not featured, visibly marked unverified) until a Moderator/Admin reviews it — creating an operational dependency on active human review capacity.

**Trade-offs:** Manual review doesn't scale as elegantly as automation at very high volume, but is the only option that fits MVP budget/timeline while still meaningfully backing the trust promise.

**When To Revisit:** If listing volume grows large enough that manual review becomes a bottleneck on new-listing time-to-live — at that point, a semi-automated pre-check feeding into the same manual approval queue is the natural next step, not a wholesale replacement of human review.

**Related Documents:** `database.md` §5.8/§5.15/§9/§11, `requirements.md` §9.3, `user-stories.md` `AGENT-007`.

---

## ADR-010: Roles implemented using PostgreSQL enum with metadata table

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** `profiles.role` is a `user_role` Postgres enum (used directly in every RLS policy); a separate, non-FK-enforced `roles` table mirrors the enum's values for display/documentation purposes only.

**Context:** Five fixed roles exist; the schema needed to represent "roles" as its own documented entity while every RLS policy in the system also needs to check the current user's role as cheaply as possible.

**Options Considered:**
1. A bare `user_role` enum column on `profiles`, with no separate `roles` table at all.
2. A fully FK-enforced `roles` table (`profiles.role_id → roles.id`) — the textbook 3NF approach.
3. Both: an enum column for authorization checks, plus a non-FK-enforced `roles` metadata table for display.

**Decision Drivers:** RLS performance and simplicity — nearly every RLS policy in this schema checks the caller's role, so keeping that check a single-column comparison (no join) matters more here than almost anywhere else in the schema. At the same time, a bare enum alone doesn't satisfy the need for role labels/descriptions/ordering in admin UI.

**Rationale:** Option 2 would require every RLS policy — the single most frequently evaluated check in the system — to join against `roles` just to resolve a role, adding real complexity and a small but real cost to the hottest path in the database. Option 3 gets the RLS performance of option 1 while still giving roles a real, documented table for display purposes.

**Consequences:** The `roles` table is not authoritative and not FK-enforced — adding a new role requires two coordinated changes (an `ALTER TYPE` migration and a `roles` table insert), not one, and this is deliberately documented so it isn't forgotten.

**Trade-offs:** Two places describing "what roles exist" instead of one, in exchange for RLS-check performance and simplicity on the far more frequently touched path.

**When To Revisit:** If the platform needs dynamic, admin-configurable custom roles rather than the fixed five defined for MVP — at that point, option 2's FK-enforced table becomes the better trade despite the RLS join cost, and this ADR should be explicitly superseded.

**Related Documents:** `database.md` §2/§4.1/§5.1/§5.2/§6, `coding-standards.md` §6.

---

## ADR-011: Composite primary keys for pure junction tables

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** `property_amenities` and `favorites` — the schema's only pure many-to-many junction tables — use a composite primary key on their two foreign keys, rather than a surrogate UUID, as a deliberate, scoped exception to the project's universal UUID-primary-key rule.

**Context:** `database.md` §2's general principle is a UUID primary key on every table; these two tables have no attributes beyond the relationship they represent.

**Options Considered:**
1. Apply the UUID-PK rule universally, adding a surrogate `id` plus a separate `UNIQUE(property_id, amenity_id)`-style constraint to still prevent duplicate rows.
2. A composite primary key on the two foreign keys, as a documented exception for junction tables specifically.

**Decision Drivers:** A junction row has no identity beyond the pair it links — a surrogate UUID here would be an unused column no code ever reads, and it wouldn't even remove the need for the composite uniqueness constraint, only add a redundant column on top of it.

**Rationale:** Option 2 is standard, well-established relational database practice for exactly this table shape, and avoids a genuinely pointless column on the two tables where it would serve no purpose.

**Consequences:** These two tables look structurally different from every other table in the schema (no `id` column) — documented explicitly in `database.md` §2/§5.11/§5.12 so a future reader recognizes it as deliberate, not an inconsistency.

**Trade-offs:** A minor loss of structural uniformity across the schema, in exchange for not adding a column that would serve no purpose on exactly these two tables.

**When To Revisit:** If either table is ever extended to need row-level identity beyond the pair it links (e.g. `favorites` supporting multiple named "save lists" per customer, requiring a row to be referenced independently) — at that point a surrogate key becomes genuinely necessary for that specific table.

**Related Documents:** `database.md` §2/§5.11/§5.12.

---

## ADR-012: Business rules enforced in both Service Layer and Database

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The highest-stakes business rules — the booking-availability guard and verification-authority restrictions — are enforced in both the Service layer (fast, specific, user-facing errors) *and* the database (an unconditional trigger/RPC backstop) — not in only one or the other.

**Context:** `architecture.md`'s Hook → Service → Repository flow places business logic in Services by default, but a Service-layer-only rule is not actually a guarantee against a bug, a skipped code path, or a direct API call bypassing it.

**Options Considered:**
1. Enforce exclusively in the Service layer, trusting it is never bypassed.
2. Enforce exclusively in the database (triggers/RPCs), giving up fast, specific application-level error messages.
3. Defense-in-depth: Service layer as the primary, fast-feedback check; database trigger/RPC as an unconditional backstop that holds regardless of what called it.

**Decision Drivers:** The consequence of getting this wrong (a customer booking an unavailable property, or an agent self-verifying their own listing) is a real trust and data-integrity failure, not a cosmetic bug — worth the cost of enforcing it twice.

**Rationale:** Option 3 gives users the good UX of option 1 (a specific error before submission) without accepting option 1's actual risk — the database's `prevent_booking_unavailable_property()` trigger and `set_property_verification()` RPC (`database.md` §9) hold even if the Service layer has a bug or is bypassed entirely.

**Consequences:** The same rule is expressed twice — once in TypeScript (Service), once in SQL (trigger/RPC) — meaning a future change to the rule must be updated in both places, a real, accepted maintenance cost.

**Trade-offs:** Duplicated logic across two layers/languages, in exchange for a guarantee that holds even when the Service layer is buggy or bypassed. This pattern is reserved for the highest-stakes rules specifically — most validation stays Service-layer-only via Zod (`coding-standards.md` §14).

**When To Revisit:** Not expected to be revisited as a general pattern. If duplication maintenance across many rules ever becomes a genuine burden, a code-generation approach deriving the trigger from a single rule definition could be explored — speculative, not currently planned.

**Related Documents:** `database.md` §9, `api-design.md` §2.2/§2.4, `coding-standards.md` §11.

---

## ADR-013: OpenStreetMap selected instead of Google Maps

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** Property location maps use OpenStreetMap tile data via Leaflet, not Google Maps Platform.

**Context:** `requirements.md` FR-PROP-013/014/015 requires an interactive property-location map with external directions.

**Options Considered:**
1. Google Maps Platform (Maps JavaScript API + Geocoding).
2. Mapbox.
3. OpenStreetMap via Leaflet.

**Decision Drivers:** **Licensing/cost** — Google Maps Platform requires a billing account and per-load/per-request charges past a free tier, an unpredictable, usage-scaling cost for a pre-revenue MVP. **Long-term flexibility** — OpenStreetMap's data and Leaflet's library are both open-source, with no API-key dependency, no usage-based billing risk, and no vendor lock-in to migrate away from later. **Bundle size** — Leaflet's React integration is materially lighter than Google's JS SDK, mattering against the performance budget (`coding-standards.md` §20).

**Rationale:** Mapbox shares Google's usage-based billing model without a clear enough advantage over Leaflet+OSM for this project's needs to justify it; OpenStreetMap was chosen specifically for its zero marginal cost and lack of lock-in.

**Consequences:** OSM's tile/geocoding data quality in Kenya may be less polished than Google's in some rural or newly-developed areas — accepted, and mitigated by the platform's Nairobi-first initial scope (`vision.md`), where OSM coverage is strong.

**Trade-offs:** Google Maps offers superior global geocoding/street-level accuracy and a more polished default UI, at the cost of unpredictable billing and vendor lock-in; OpenStreetMap trades some polish for zero marginal cost and full control.

**When To Revisit:** If map data quality in Kenyan neighborhoods becomes a real, reported user complaint, or if the platform's revenue makes Google Maps' cost a rounding error rather than a bootstrap risk.

**Related Documents:** `architecture.md` §14, `ui-guidelines.md` §12.11, `requirements.md` §6.4.

---

## ADR-014: Documentation-first development workflow

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The complete documentation baseline — all ten `docs/*.md` files plus `CLAUDE.md` — was written and approved in full *before* any application code, as Sprint 0's explicit, hard exit criterion, rather than being written incrementally alongside early feature work.

**Context:** This is distinct from ADR-001 (the ongoing practice of documentation-driven engineering) — this decision specifically concerns the *sequencing* of the initial planning work.

**Options Considered:**
1. Write just enough documentation to start Sprint 1, filling in the rest of `docs/` incrementally as features are built.
2. Complete the full documentation baseline before any application code — a hard, code-free planning phase.

**Decision Drivers:** Cross-document consistency — `api-design.md`'s DTOs are only correct because `database.md`'s schema was already settled; `ui-guidelines.md`'s component states depend on `database.md`'s enums; writing these interleaved with code risks exactly the contradictions this documentation set exists to prevent, and a solo-AI project has no team available to catch such contradictions in review before they're built on.

**Rationale:** Option 2 was chosen because the later documents in the set (`api-design.md`, `ui-guidelines.md`, `coding-standards.md`, `roadmap.md`) all genuinely depend on decisions made in the earlier ones — writing them out of order, or after code already existed, would risk the code and the documentation disagreeing from day one.

**Consequences:** No application code existed for the entirety of Sprint 0 — a visible "nothing built yet" period a stakeholder unfamiliar with the rationale might misread as slow progress.

**Trade-offs:** Slower time-to-first-code, in exchange for a foundation with no undocumented, contradictory, or unconsidered decision waiting to be discovered mid-implementation.

**When To Revisit:** Not expected to be revisited for this project's remaining scope — the documentation baseline is complete (`docs/project-state.md`). This ADR's reasoning would apply again only to a future from-scratch major rewrite.

**Related Documents:** `roadmap.md` §2/§4, `CLAUDE.md` §1, `coding-standards.md` §1.

---

## ADR-015: Task-based AI development workflow

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** Development is coordinated through three purpose-built mechanisms: `docs/roadmap.md` (the plan), `docs/project-state.md` (the append-only diary of actual progress), and `CLAUDE.md` (the binding operating manual read at the start of every session).

**Context:** The project is built across many discrete AI sessions, each starting with no memory of any prior session unless state is externalized in the repository itself.

**Options Considered:**
1. Rely on conversation/chat history alone — fails completely the moment a new session starts.
2. A single informal "notes" file with no defined structure or update discipline.
3. A defined trio of mechanisms, each with an explicit purpose, structure, and update rule.

**Decision Drivers:** Session continuity — anything not written down is lost the instant a session ends; an append-only history (rather than an overwritten status) preserves an audit trail of what actually happened, which matters when the only reviewer of past decisions is a future instance of the same AI collaborator, working from the same written record.

**Rationale:** Option 3 was chosen because option 1 fails by construction, and option 2 doesn't specify *how* to keep the notes trustworthy — `project-state.md`'s explicit append-only, never-overwrite rule is what makes "read this file first" (`CLAUDE.md` §4) a reliable first step rather than a guess.

**Consequences:** Discipline is required to actually update `project-state.md` at the end of every session (`CLAUDE.md` §4, step 9) — skipping this step silently reintroduces the exact problem this workflow exists to solve.

**Trade-offs:** Overhead of maintaining a structured state file versus simply "remembering" — accepted because the alternative (a memoryless session guessing at prior progress) is strictly worse, and is already named as a real risk in `roadmap.md` §16.

**When To Revisit:** If a second human developer joins, this mechanism likely needs to expand (e.g. per-person session logs) rather than be abandoned — its core append-only, session-boundary-aware principle would likely persist through that change.

**Related Documents:** `CLAUDE.md` §4/§17, `roadmap.md` §16/§23, `docs/project-state.md`.

---

## ADR-016: GitHub + Vercel deployment strategy

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The frontend deploys via GitHub → Vercel, with Cloudflare for DNS/CDN and Supabase Cloud for the backend — no self-managed server.

**Context:** A solo developer needs a deployment pipeline with near-zero ongoing operational burden.

**Options Considered:**
1. A self-managed server (e.g. a VPS running Docker/nginx) with a hand-built CI/CD pipeline.
2. A different managed frontend host (Netlify, Cloudflare Pages).
3. Vercel, integrated directly with GitHub for automatic per-PR preview deployments.

**Decision Drivers:** Zero-ops deployment — no server to patch, scale, or monitor; first-class Git integration giving every PR an automatic preview URL, directly supporting `roadmap.md` §2's "working, reviewable increment every sprint" principle; a natural fit for a Vite + React SPA with no unusual configuration required; Cloudflare was already selected for DNS/CDN, and Vercel + Cloudflare is a well-established, low-friction combination.

**Rationale:** Option 1 would require the solo developer to build the exact preview-deployment/CI convenience Vercel provides by default; option 3 was chosen over option 2 primarily for its GitHub integration maturity and the project's existing familiarity with the combination.

**Consequences:** Coupling to Vercel's specific deployment model and pricing — acceptable at MVP scale.

**Trade-offs:** Less infrastructure control than a self-managed server, in exchange for materially less operational burden — the right trade for a solo developer's time budget.

**When To Revisit:** If Vercel's pricing at real post-launch traffic becomes disproportionate to the value of its convenience — worth a cost review at that point, not before, since MVP-stage usage sits well within free/low-cost tiers.

**Related Documents:** `architecture.md` §19, `roadmap.md` §20.

---

## ADR-017: Current MVP scope

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The MVP explicitly excludes online rent payments (including M-Pesa), property management functionality (lease management, maintenance tickets, landlord accounting), tenant screening/management, complex in-app messaging beyond viewing-request notes, and native mobile applications.

**Context:** `vision.md`'s "Out of Scope" section and `requirements.md` §16's "Explicitly Deferred Features" both already name these exclusions; this ADR consolidates the decision and its rationale in one place as the definitive scope boundary, and records it as a *decision*, not just a list.

**Options Considered:**
1. A broader "full property management platform" scope, including payments and lease management.
2. The narrower "discovery plus physical viewing booking" scope actually chosen.

**Decision Drivers:** `vision.md`'s MVP hypothesis is specific and narrow — "people are willing to use a trusted digital platform to discover rental properties and book physical viewings" — nothing about payments, leases, or messaging is needed to validate it; `branding.md` explicitly states the platform "is NOT a property management system and NOT a classifieds website"; each excluded capability (payments compliance, lease legal requirements) is independently complex enough that building it before validating the core hypothesis would be a real risk of wasted effort.

**Rationale:** Option 2 was chosen because it ships faster and tests the actual hypothesis this business is founded on, without the individually significant compliance/legal/engineering cost of the excluded capabilities.

**Consequences:** Feature requests for payments, messaging, or mobile apps during development must be recognized as out of scope and redirected to the Future Roadmap (`roadmap.md` §22, ADR-018) rather than absorbed as scope creep.

**Trade-offs:** A narrower MVP means a slower path to a fully-featured product, in exchange for faster, lower-risk hypothesis validation and a smaller initial security/compliance surface (no payment data, no lease legal exposure).

**When To Revisit:** Once `requirements.md` §15's MVP Success Criteria are met in production (`roadmap.md` Sprint 9) and real usage data validates the core hypothesis — individual Future items then become candidates for a genuinely new, deliberate scoping decision (see ADR-018), not something arrived at by drift.

**Related Documents:** `vision.md` "Out of Scope", `requirements.md` §16, `user-stories.md` Epic 10, `roadmap.md` §22.

---

## ADR-018: Future extensibility strategy

**Status:** Accepted
**Date:** 2026-07-17

**Decision:** The MVP schema, API, and UI token system were each deliberately designed with named, verified extension points for every known Future item (ADR-017), so that building each one later requires only additive work — never a foundational rework.

**Context:** Excluding a feature from the MVP (ADR-017) is only a safe decision if the approved architecture doesn't have to be reworked to add it back in later.

**Extension points, by Future item:**
- **M-Pesa (`FUT-001`):** a `payments` table sketch (`database.md` §15) attaching to the existing `viewing_requests`/customer graph, plus a webhook Edge Function following the pattern already established for `send-booking-notifications` (`api-design.md` §12/§22).
- **Premium listings (`FUT-003`):** `properties.is_featured` already exists as a real column (`database.md` §5.8); a future `subscriptions` table would gate it using the same RPC-authorization pattern already proven by `set_property_verification`.
- **Native mobile apps (`FUT-006`):** the Service/Repository layer is plain, framework-agnostic TypeScript (`architecture.md` §9) — reusable from a React Native client against the same Supabase project with zero backend change.
- **AI recommendations (`FUT-005`):** `favorites`, `viewing_requests`, and `activity_logs` already capture the behavioral data a recommender needs; a future `recommendations` cache table (`database.md` §15) is purely additive.
- **Agency self-service onboarding (`FUT-002`):** `agencies`/`agents` are already first-class, separately-owned entities (ADR-008) — onboarding is new UI/flow on an already-correct data model, not a schema change.
- **Public API:** an Edge Function gateway (`/api/v1/...`) fronting the existing Repositories, versioned independently of the internal, single-consumer contract (`api-design.md` §20).

**Decision Drivers:** `architecture.md` §20's scalability goal ("support future growth without significant restructuring") is only meaningful if checked against real, specific future items rather than left as an abstract aspiration.

**Rationale:** Each extension point above was verified against a concrete existing column, table, or layer boundary while writing `database.md` §15, `api-design.md` §22, and `ui-guidelines.md` §23 — none is speculative; each traces to something that already exists in the approved schema/architecture.

**Consequences:** A small number of MVP decisions were made slightly ahead of strict MVP necessity because they were cheap now and expensive to retrofit later (e.g. `properties.is_featured` as a plain boolean, the denormalized `agent_id` snapshot on `viewing_requests`) — a deliberate, narrow exception to "don't build for hypothetical future requirements" (`coding-standards.md` §2), scoped only to genuinely-planned Future items, never speculative ones.

**Trade-offs:** A handful of small, low-cost forward-compatibility decisions versus a strictly YAGNI-pure MVP — judged worth it precisely because each one was checked against a real, already-named Future item rather than a guess about what might be needed.

**When To Revisit:** Each Future item, when actually greenlit, gets its own dedicated documentation-first planning pass (ADR-014) rather than being built directly against this ADR's sketch — this ADR establishes that the path is clear, not that any future design is final.

**Related Documents:** `database.md` §15, `api-design.md` §22, `ui-guidelines.md` §23, `roadmap.md` §22, `user-stories.md` Epic 10.

---

# Future ADR Process

| Aspect | Rule |
|---|---|
| **When to create a new ADR** | Any decision meeting the criteria in §1 — affects architecture/schema/contract/tooling, is costly to reverse, involved a real rejected alternative, or a future reader would reasonably ask "why." |
| **Who approves an ADR** | The human developer, as Product Owner and Technical Director (`CLAUDE.md`), is the sole approver. Claude Code may draft a proposed ADR (§ Claude Code Instructions below) but never marks one "Accepted" unilaterally. |
| **How superseded decisions are handled** | A superseding ADR is a **new**, sequentially-numbered entry that explicitly references the ADR it replaces. The old ADR's `Status` is updated to `Superseded by ADR-0XX` — it is never deleted or renumbered, preserving the historical record per the same append-only philosophy as `project-state.md`. |
| **ADR numbering convention** | Sequential, zero-padded to three digits (`ADR-001`, `ADR-002`, ...), assigned once and never reused — even a rejected or later-superseded ADR keeps its number permanently. |
| **Cross-referencing with other documents** | Every ADR's `Related Documents` field links to the specific `docs/*.md` sections it derives from or governs. Conversely, whenever one of those documents is updated per its own maintenance policy (`coding-standards.md` §24, `roadmap.md` §18), check whether the change is significant enough to also warrant a new or superseding ADR — a schema change and a scope-affecting decision are not the same thing, but they sometimes coincide. |

---

# Claude Code Instructions

- **Read this file before proposing any architectural change.** An idea that seems new may already be an accepted (or explicitly rejected) ADR — check before proposing it as if it were novel.
- **Never contradict an accepted ADR in code or in a new document.** Per `CLAUDE.md` §14, approved documentation — including this ADR log — is authoritative by default; an accepted ADR is binding until formally superseded, not until it's inconvenient.
- **Draft a new ADR when recommending a major architectural change**, following the format at the top of this document, rather than silently implementing a different approach than what's already accepted. Present it as a proposal for approval (per the process above), not as a fait accompli.
- **Reference ADR IDs in commit messages, PR descriptions, and implementation notes** where relevant (e.g. "implements the RPC-authorization pattern from ADR-012") — this is what keeps the connection between a decision and the code that embodies it discoverable later.
- **If an accepted ADR appears wrong in light of new information encountered during implementation**, say so explicitly and propose superseding it (per the process above) — do not silently deviate in code while leaving the ADR log saying something the implementation no longer matches.

---

This document is the permanent decision record for Rental Hunt KE. It grows by addition only — existing entries are never rewritten or removed, only marked superseded by a new, cross-referenced entry — and should be consulted before any architectural discussion, per `CLAUDE.md` §14's decision-making framework.
