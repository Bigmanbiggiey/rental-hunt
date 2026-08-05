# Rental Hunt KE - Product Requirements Document (PRD)

> **Version:** 1.0
> **Status:** Approved
> **Owner:** Product Team
> **Project:** Rental Hunt KE

---

# 1. Product Overview

Rental Hunt KE is a rental discovery platform that enables users to search for verified rental properties, view detailed property information, and book physical viewings through trusted agents.

The MVP focuses on validating the core marketplace workflow:

**Discover → Evaluate → Book Viewing → Visit Property**

---

# 2. MVP Objectives

## Primary Objective

Enable users to find verified rental properties and successfully book physical viewings with agents.

## Secondary Objectives

* Provide accurate and up-to-date property information.
* Reduce fake or outdated listings.
* Give agents a professional platform for managing properties and viewing requests.
* Create a trustworthy user experience.

---

# 3. User Roles

## 3.1 Guest

Unauthenticated visitor.

### Permissions

* View homepage.
* Search properties.
* Apply filters.
* View property details.
* View agent information.
* Register an account.
* Login.

### Restrictions

* Cannot save favorites.
* Cannot book viewings.
* Cannot access dashboards.

---

## 3.2 Customer

Authenticated renter.

### Permissions

* All Guest permissions.
* Save favorite properties.
* Book viewings.
* View booking history.
* Update profile information.
* Cancel pending viewing requests.

---

## 3.3 Agent/Admin

Platform operator and property manager.

### Permissions

* Create properties.
* Edit properties.
* Upload property images.
* Manage availability.
* Verify listings.
* View all viewing requests.
* Update viewing status.
* Manage customer inquiries.
* Access analytics dashboard.

---

# 4. Functional Requirements

## 4.1 Authentication

### FR-AUTH-001

Users must be able to register using email and password.

### FR-AUTH-002

Users must be able to login securely.

### FR-AUTH-003

Users must be able to reset forgotten passwords.

### FR-AUTH-004

Authenticated sessions must persist across page refreshes.

### FR-AUTH-005

Role-based access control must be enforced.

---

# 5. Public Website Requirements

## 5.1 Homepage

### FR-HOME-001

Display a prominent search section.

### FR-HOME-002

Display featured verified properties.

### FR-HOME-003

Display trust indicators such as verified listings and trusted agents.

### FR-HOME-004

Display a clear call-to-action for searching properties.

---

## 5.2 Property Search

### FR-SEARCH-001

Users must be able to search by location.

### FR-SEARCH-002

Users must be able to filter by minimum and maximum rent.

### FR-SEARCH-003

Users must be able to filter by property type.

### FR-SEARCH-004

Users must be able to filter by number of bedrooms.

### FR-SEARCH-005

Users must be able to filter by amenities.

### FR-SEARCH-006

Search results must update without a full page reload.

### FR-SEARCH-007

Results must support pagination or infinite scrolling.

---

## 5.3 Property Listings

Each property card must display:

### FR-LIST-001

Primary image.

### FR-LIST-002

Property title.

### FR-LIST-003

Location.

### FR-LIST-004

Monthly rent.

### FR-LIST-005

Bedroom count.

### FR-LIST-006

Verification status.

### FR-LIST-007

Availability status.

### FR-LIST-008

Quick view or details action.

---

## 5.4 Static & Legal Content

Added post-Sprint-8 (2026-08-05): a documentation-drift review found these pages were never scoped, despite `Footer.tsx` flagging the gap since Sprint 1.

### FR-CONTENT-001

The homepage must explain what Rental Hunt KE is and the search → compare → book viewing flow. Reworked 2026-08-05 from a standalone About page into a section on the homepage itself — no separate route.

### FR-CONTENT-002

A public Contact page must let a guest or signed-in user submit a name, email, and message. Submissions are stored for admin review; no outbound email delivery is required for MVP.

### FR-CONTENT-003

An admin-only screen must let an admin view, resolve, and delete Contact submissions.

### FR-CONTENT-004

A public Terms of Service page and a public Privacy Policy page must exist before production launch (§13, `roadmap.md` §13). Content requires real legal/company text supplied by the Product Owner — not fabricated by an engineering session.

### FR-CONTENT-005

The catch-all not-found route must render a genuine "page not found" message distinct from the in-development `PlaceholderPage` copy used for unbuilt routes.

---

# 6. Property Details Requirements

## 6.1 Core Information

### FR-PROP-001

Property title.

### FR-PROP-002

Full description.

### FR-PROP-003

Exact or approximate location.

### FR-PROP-004

Rent amount.

### FR-PROP-005

Deposit amount.

### FR-PROP-006

Availability status.

### FR-PROP-007

Last verified date.

### FR-PROP-008

Assigned agent.

---

## 6.2 Media Gallery

### FR-PROP-009

Support multiple images per property.

### FR-PROP-010

Display images in a responsive gallery.

### FR-PROP-011

Allow full-screen image viewing.

---

## 6.3 Amenities

### FR-PROP-012

Display available amenities including parking, borehole, security, WiFi, balcony, furnished status, and pet allowance.

---

## 6.4 Map Integration

### FR-PROP-013

Display property location on an interactive map.

### FR-PROP-014

Use OpenStreetMap as the map provider.

### FR-PROP-015

Allow users to open directions externally.

---

# 7. Favorites Requirements

## FR-FAV-001

Authenticated customers must be able to save properties.

## FR-FAV-002

Customers must be able to remove saved properties.

## FR-FAV-003

Customers must have a dedicated favorites page.

---

# 8. Viewing Booking Requirements

## 8.1 Booking Creation

### FR-BOOK-001

Customers must be able to request a viewing from a property page.

### FR-BOOK-002

The booking form must capture preferred date and time.

### FR-BOOK-003

The system must prevent booking unavailable properties.

### FR-BOOK-004

Customers must receive confirmation after submission.

---

## 8.2 Booking Statuses

Supported statuses:

* Pending
* Confirmed
* Completed
* Cancelled
* No Show

### FR-BOOK-005

Agents must be able to update booking status.

### FR-BOOK-006

Customers must see real-time booking status updates.

---

# 9. Agent Dashboard Requirements

## 9.1 Dashboard Overview

### FR-DASH-001

Display total properties.

### FR-DASH-002

Display active listings.

### FR-DASH-003

Display pending viewings.

### FR-DASH-004

Display completed viewings.

---

## 9.2 Property Management

### FR-DASH-005

Create new properties.

### FR-DASH-006

Edit existing properties.

### FR-DASH-007

Archive properties.

### FR-DASH-008

Manage property images.

### FR-DASH-009

Update availability.

---

## 9.3 Verification Workflow

### FR-DASH-010

Properties must have verification statuses: Unverified, Pending Verification, Verified, Rejected.

### FR-DASH-011

Only verified properties appear in public featured sections.

---

# 10. Customer Dashboard Requirements

### FR-CUST-001

View saved properties.

### FR-CUST-002

View upcoming viewings.

### FR-CUST-003

View past viewings.

### FR-CUST-004

Update personal profile.

### FR-CUST-005

Manage notification preferences.

---

# 11. Data Requirements

## 11.1 Property Data

Required fields:

* Title
* Slug
* Description
* County
* Area/Neighborhood
* Latitude
* Longitude
* Property type
* Bedrooms
* Bathrooms
* Rent amount
* Deposit amount
* Availability status
* Verification status
* Last verified date
* Agent ID
* Created at
* Updated at

---

## 11.2 Image Data

* Property ID
* Image URL
* Alt text
* Display order
* Uploaded at

---

## 11.3 Viewing Data

* Customer ID
* Property ID
* Agent ID
* Requested date
* Requested time
* Status
* Notes
* Created at
* Updated at

---

# 12. Search Requirements

## NFR-SEARCH-001

Search results should return within 2 seconds under normal load.

## NFR-SEARCH-002

Search must support partial location matching.

## NFR-SEARCH-003

Filters must be combinable.

## NFR-SEARCH-004

URLs should reflect active filters for sharing.

---

# 13. Non-Functional Requirements

## 13.1 Performance

* Initial page load < 3 seconds on 4G.
* Largest Contentful Paint < 2.5 seconds.
* Images must be optimized and lazy-loaded.

---

## 13.2 Security

* Use Supabase Authentication.
* Enforce Row Level Security (RLS).
* Validate all user input.
* Sanitize rich text content.
* Protect dashboard routes.

---

## 13.3 Reliability

* Graceful handling of API failures.
* User-friendly error messages.
* Automatic retry for transient requests.
* No data loss during image uploads.

---

## 13.4 Accessibility

* WCAG AA color contrast.
* Keyboard navigable interfaces.
* Screen-reader friendly forms.
* Alt text for all images.

---

## 13.5 Responsiveness

The application must support:

* Mobile phones
* Tablets
* Laptops
* Desktop monitors

Mobile is the primary target for the MVP.

---

# 14. Technical Requirements

## Frontend

* React 19
* Vite
* TypeScript
* Tailwind CSS v4
* React Router
* TanStack Query
* React Hook Form
* Zod
* Leaflet

## Backend

* Supabase PostgreSQL
* Supabase Auth
* Supabase Storage
* Supabase Realtime

## Hosting

* Vercel (frontend)
* Supabase Cloud (backend)
* Cloudflare (DNS and CDN)

---

# 15. MVP Success Criteria

The MVP is considered successful when all of the following are true:

* A guest can search for properties.
* A user can register and login.
* A customer can save a property.
* A customer can book a viewing.
* An agent can create and verify a listing.
* A booking appears in the agent dashboard.
* The customer receives confirmation.
* The property can be marked unavailable.
* The entire workflow functions on mobile devices.

---

# 16. Explicitly Deferred Features

These features must not be implemented during the MVP unless the roadmap is formally updated:

* Online rent payments
* M-Pesa checkout
* Lease generation
* Digital signatures
* Tenant credit checks
* Property maintenance tickets
* AI chat assistant
* AI property recommendations
* Native iOS/Android apps
* Multi-agency SaaS support (an agent working across *multiple* agencies at once — `FUT-004`; still deferred. Distinct from §17's Agency Marketplace, which keeps the existing one-agency-per-agent model and only adds *how* an agency itself gets created — self-service instead of admin-only.)
* Subscription billing
* Public API access
* Property sales marketplace

---

# 17. Agency Marketplace Requirements (Added 2026-08-05)

Appended rather than inserted mid-numbering, to avoid renumbering every cross-reference to §11–§16 elsewhere in this doc set. Ahead of `FUT-002`'s original deferred placement (§16) — a deliberate developer decision, see `docs/decisions.md` ADR-035. Full detail: `user-stories.md` Epic 12, `database.md` §5.3/new `reviews` table, `roadmap.md`'s new Sprint 9.

### FR-AGENCY-001
A signed-in customer can submit a self-service agency application (name, description, contact info, county, logo URL, social links). The application starts in a non-public, pending-review state regardless of client input.

### FR-AGENCY-002
An admin can approve or reject a pending agency application. Approval atomically activates the agency, promotes the applicant to the `agent` role, and creates their `agents` row. Rejection requires a reason.

### FR-AGENCY-003
A public, guest-reachable Agency Profile Page (`/agencies/:slug`) shows an agency's details, contact info, social links, aggregate rating, active property listings, and active agents (each with their own rating).

### FR-AGENCY-004
A customer may leave one rating (1–5) and optional comment per completed viewing request. The review's agency/agent/property association is derived server-side from the viewing request, never client-supplied. An admin can moderate (soft-remove) a review.

### FR-AGENCY-005
The Admin Overview's stat cards each link to a browsable, paginated (10 rows/page) list of the underlying records.

This document serves as the single source of truth for the Rental Hunt KE MVP scope and engineering implementation.
