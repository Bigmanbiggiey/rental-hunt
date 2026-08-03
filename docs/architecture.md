# Rental Hunt KE - System Architecture

> **Version:** 1.0
> **Status:** Approved
> **Owner:** Engineering Team
> **Project:** Rental Hunt KE

---

# 1. Purpose

This document defines the technical architecture for Rental Hunt KE.

Its purpose is to establish consistent engineering decisions before implementation begins, ensuring that every contributor—including AI development tools—follows the same architectural standards.

This document serves as the authoritative reference for application structure, technology choices, coding organization, data flow, and deployment.

---

# 2. Architecture Goals

The architecture is designed to prioritize:

* Simplicity
* Maintainability
* Scalability
* Performance
* Security
* Type Safety
* Developer Experience
* Cost Efficiency

The MVP should remain easy to understand while supporting future growth without major rewrites.

---

# 3. High-Level Architecture

```text
┌─────────────────────────────┐
│        Web Browser          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ React + TypeScript + Vite   │
│ Tailwind CSS v4             │
│ TanStack Query              │
│ React Router                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     Repository Layer        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Supabase             │
│                             │
│ • PostgreSQL                │
│ • Authentication            │
│ • Storage                   │
│ • Realtime                  │
│ • Edge Functions            │
└─────────────────────────────┘
```

---

# 4. Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS v4
* React Router
* TanStack Query
* React Hook Form
* Zod
* shadcn/ui
* Leaflet
* OpenStreetMap

---

## Backend Platform

Supabase

Services used:

* PostgreSQL
* Authentication
* Storage
* Realtime
* Edge Functions (future business logic)

---

## Hosting

Frontend

* Vercel

Backend

* Supabase Cloud

DNS & CDN

* Cloudflare

---

# 5. Project Structure

```text
frontend/
└── src/
    ├── app/
    ├── pages/
    ├── widgets/
    ├── features/
    ├── entities/
    ├── shared/
    ├── routes/
    ├── assets/
    └── styles/
```

---

## Layer Responsibilities

### app/

Application bootstrap.

Contains:

* Providers
* Router
* Global configuration
* Application initialization

---

### pages/

Top-level route pages.

Examples:

* Home
* Property Details
* Login
* Dashboard

Pages compose widgets and features but contain minimal business logic.

---

### widgets/

Large reusable UI sections.

Examples:

* Search Hero
* Property Grid
* Featured Listings
* Dashboard Overview
* Booking Calendar

---

### features/

Business functionality.

Examples:

* Authentication
* Property Search
* Favorites
* Viewing Requests
* Profile Management
* Agent Properties (Sprint 6 — AGENT-002–007's create/edit/archive/images/availability/verification-submission)
* Agent Bookings (Sprint 6 — BOOK-001–006's queue and status transitions)
* Agent Dashboard (Sprint 6 — AGENT-001's summary counts)
* Agent Analytics (Sprint 6 — AGENT-008's basic per-property view/request charts)

Each feature owns:

```text
components/
hooks/
services/
repositories/
schemas/
types/
```

---

### entities/

Domain models.

Examples:

* Property
* User
* Booking
* Agency
* Amenity
* Agent (added Sprint 6 — `getCurrentAgent()`; cross-cutting across every agent-dashboard feature, per the same "3+ real consumers" test already applied to `Booking`/`ViewingRequest`)

Each entity contains:

* Types
* Mappers
* Validation
* Repository interfaces

---

### shared/

Reusable code shared across the application.

Includes:

* UI components
* Hooks
* Utilities
* Constants
* Icons
* API client
* Supabase client

---

# 6. Routing Strategy

**Post-Sprint-8 restructuring (2026-08-04 — see `decisions.md`'s ADR reversing Sprint 7's single shared `/admin` shell):** every authenticated role now has its own independent, top-level dashboard route group instead of one shared `/dashboard` (role-branched content) plus one shared `/admin` (moderator+admin, role-branched content). Each group is a **sibling** of the public route tree in `routes.tsx`, not nested under it — the public site's `Header`/`Footer` never render alongside a dashboard shell, which is what actually fixes a real double-navbar bug the old nesting caused (every dashboard screen was rendering both the public `Header` *and* its own dashboard header at once). Each group is wrapped by its own layout widget, all four built on one shared, generic `DashboardShell` (`widgets/dashboard-shell/`) — sidebar nav + sticky header + account menu — so the shell markup itself isn't duplicated four times, only the nav-link config differs per role.

## Public Routes

* /
* /properties
* /properties/:slug
* /login
* /register
* /forgot-password

---

## Authenticated Routes

The one authenticated route that isn't part of any specific role's dashboard — profile management is role-agnostic.

* /profile

## Admin Routes (role = admin only)

Wrapped by `AdminDashboardLayout` (`widgets/admin-dashboard-layout/`), a thin config of the shared `DashboardShell`. Reachable only by `role: 'admin'` (`ProtectedRoute allowedRoles={['admin']}`) — moderator has its own separate group below, so this layout no longer needs the role-filtered-nav-links logic the old shared `/admin` shell required.

* /admin-dashboard — `AdminOverviewPage` (platform-wide stat cards)
* /admin-dashboard/verification-queue
* /admin-dashboard/users
* /admin-dashboard/agencies
* /admin-dashboard/analytics
* /admin-dashboard/activity-logs

(The old `/admin/properties`/`/admin/bookings` `PlaceholderPage` stubs were dropped in this restructuring rather than carried forward — dead placeholder routes with no real content and no DoD dependency.)

## Moderator Routes (role = moderator only)

Wrapped by `ModeratorDashboardLayout` (`widgets/moderator-dashboard-layout/`) — its own route group, not a role-filtered view inside admin's. Reuses the exact same `AdminVerificationQueuePage`/`AdminActivityLogPage` components and `admin-verification`/`admin-activity-log` feature hooks admin uses (RLS already scopes what a moderator can see/do — no separate moderator-only data layer was built).

* /moderator-dashboard — `ModeratorDashboardOverviewPage` (the verification queue itself — a moderator's only real dashboard action per `roadmap.md` §11's DoD)
* /moderator-dashboard/verification-queue
* /moderator-dashboard/activity-logs

## Agent Routes (role = agent only, Sprint 6)

Wrapped by `AgentDashboardLayout` (`widgets/agent-dashboard-layout/`). Simplified in this restructuring: `/agent-dashboard` is now its own dedicated root, so the layout no longer needs the `children`-vs-`Outlet` duality Sprint 6's Gap 3 required back when `/dashboard` had to double as the generic authenticated landing page for every role — every agent route, including the overview, is reached the same way now, via `<Outlet/>`.

* /agent-dashboard — `AgentDashboardOverviewPage`
* /agent-dashboard/properties
* /agent-dashboard/properties/new
* /agent-dashboard/properties/:id/edit
* /agent-dashboard/bookings
* /agent-dashboard/analytics

## Customer Routes (role = customer only)

Wrapped by `UserDashboardLayout` (`widgets/user-dashboard-layout/`) — previously the only role with no dedicated dashboard shell at all; Favorites/Bookings were separate, unlinked top-level routes. Now structurally symmetric with the other three roles.

* /user-dashboard — `UserDashboardOverviewPage` (upcoming + completed viewings)
* /user-dashboard/favorites
* /user-dashboard/bookings

---

All four dashboard route groups require authentication and role verification (`ProtectedRoute allowedRoles={[...]}`) — client-side UX only, per that component's own documented philosophy; RLS remains the real security boundary regardless of which URL a request reaches it through.

---

# 7. Authentication Architecture

Authentication is handled entirely by Supabase Auth.

Supported methods:

* Email & Password
* Password Recovery

Future:

* Google Sign-In

Authorization is enforced using Supabase Row Level Security (RLS).

The frontend must never rely solely on hidden UI elements to enforce permissions.

---

# 8. User Roles

* Guest
* Customer
* Agent
* Moderator
* Admin

Every authenticated user has an associated profile.

Permissions are enforced at the database level using RLS policies.

---

# 9. Data Access Architecture

Application components must never communicate directly with Supabase.

Data access follows this flow:

```text
Component
      ↓
Custom Hook
      ↓
Service
      ↓
Repository
      ↓
Supabase Client
```

Responsibilities:

**Hooks**

* UI state
* Query orchestration

**Services**

* Business logic
* Validation
* Workflow coordination

**Repositories**

* Database communication
* CRUD operations
* Query abstraction

This separation allows future migration away from Supabase with minimal impact.

---

# 10. State Management

Global application state should be kept minimal.

## Server State

Managed with TanStack Query.

## Form State

Managed with React Hook Form.

## Validation

Handled using Zod schemas.

## UI State

Managed using React state and context where appropriate.

Redux or other global state libraries are intentionally excluded from the MVP.

---

# 11. Database Architecture

Core entities include:

* Agencies
* Profiles
* Properties
* Property Images
* Amenities
* Property Amenities
* Favorites
* Viewing Requests

Future entities include:

* Payments
* Notifications
* Reviews
* Subscriptions

The database should remain normalized.

---

# 12. Storage Strategy

All media assets are stored in Supabase Storage.

Only metadata and URLs are stored in PostgreSQL.

Supported uploads:

* Property Images

Future:

* Agency Logos
* User Avatars
* Property Videos

---

# 13. Search Architecture

MVP search is powered by PostgreSQL queries through Supabase.

Supported filters:

* Location
* Property Type
* Bedrooms
* Bathrooms
* Price Range
* Amenities
* Verification Status

Future versions may introduce Meilisearch without changing frontend APIs.

---

# 14. Maps

Provider:

OpenStreetMap

Library:

Leaflet

Reasons:

* Open source
* No licensing fees
* Lightweight
* Excellent React support

---

# 15. UI Architecture

Component hierarchy:

```text
Page
   ↓
Widget
   ↓
Feature
   ↓
Entity
   ↓
Shared Component
```

Business logic belongs inside features.

Shared components must remain presentation-focused.

---

# 16. Error Handling

Every asynchronous operation must handle:

* Loading
* Success
* Empty State
* Error State

Errors should be user-friendly.

Unexpected failures should be logged for future monitoring.

---

# 17. Performance Strategy

The application should:

* Lazy-load routes.
* Optimize images.
* Use query caching.
* Paginate property results.
* Minimize bundle size.
* Avoid unnecessary re-renders.

Performance is a feature, not an afterthought.

---

# 18. Security

Security principles include:

* Row Level Security (RLS)
* Input validation
* Secure authentication
* Principle of least privilege
* Protected routes
* HTTPS-only deployment
* Secure environment variables

No sensitive credentials are exposed to the frontend.

---

# 19. Deployment Architecture

Frontend:

Vercel

Backend:

Supabase Cloud

Domain:

Cloudflare

Deployment Flow:

GitHub → Vercel → Production

Future environments:

* Development
* Staging
* Production

---

# 20. Scalability

The architecture is designed to support:

* Multiple agencies
* Additional cities
* Mobile applications
* Premium subscriptions
* Public APIs
* AI-assisted search
* Analytics
* Edge Functions

without significant restructuring.

---

# 21. Engineering Principles

The following principles are mandatory throughout development:

* Feature-first organization.
* Strong TypeScript typing.
* Small, reusable components.
* Business logic separated from UI.
* Consistent naming conventions.
* No duplicated logic.
* Documentation updated alongside implementation.
* Testability considered during design.

---

# 22. Architecture Decision Summary

| Area           | Decision                       |
| -------------- | ------------------------------ |
| Frontend       | React 19 + TypeScript + Vite   |
| Styling        | Tailwind CSS v4 + shadcn/ui    |
| Backend        | Supabase                       |
| Database       | PostgreSQL                     |
| Authentication | Supabase Auth                  |
| Storage        | Supabase Storage               |
| Maps           | Leaflet + OpenStreetMap        |
| Data Fetching  | TanStack Query                 |
| Forms          | React Hook Form + Zod          |
| State          | React + TanStack Query         |
| Deployment     | Vercel + Supabase + Cloudflare |
| Organization   | Feature-Sliced Design (FSD)    |
| Data Access    | Repository Pattern             |
| Security       | Supabase RLS                   |
| Future Compute | Supabase Edge Functions        |
