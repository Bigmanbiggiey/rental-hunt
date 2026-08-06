# Rental Hunt KE - User Stories

> **Version:** 1.0
> **Status:** Draft
> **Owner:** Product Team
> **Related Documents:** [branding.md](./branding.md), [vision.md](./vision.md), [requirements.md](./requirements.md)

---

# Purpose

This document defines the complete user journeys for the Rental Hunt KE MVP. It translates the Product Requirements Document into discrete, testable user stories organized by epic, and serves as the primary reference for sprint planning and feature implementation.

Every story is written from the perspective of the end user (Guest, Customer, Agent/Admin) or the system itself, and reflects the platform's core promise of **trust, transparency, and simplicity** as defined in the branding guide.

---

# User Story Format

Every story includes:

| Field | Description |
|---|---|
| **Story ID** | Unique sequential identifier, prefixed by epic (e.g., `AUTH-001`) |
| **Priority** | Critical, High, Medium, or Low |
| **Epic** | The parent epic this story belongs to |
| **Title** | Short descriptive name |
| **User Story** | "As a ___, I want ___, so that ___" |
| **Acceptance Criteria** | Concise, testable conditions of satisfaction |

---

# Epic 1 - User Authentication

## AUTH-001
**Priority:** Critical
**Epic:** User Authentication
**Title:** Register with Email and Password

**User Story:** As a guest, I want to register an account using my email and password, so that I can access authenticated features like saving properties and booking viewings.

**Acceptance Criteria:**
- Registration form requires a valid email and a password meeting minimum strength rules.
- Duplicate email addresses are rejected with a clear error message.
- On success, the user is assigned the Customer role and signed in.
- Invalid input is flagged inline before submission.

---

## AUTH-002
**Priority:** Critical
**Epic:** User Authentication
**Title:** Login Securely

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my account and its features.

**Acceptance Criteria:**
- Valid credentials grant access and redirect to the intended page.
- Invalid credentials show a generic error without revealing whether the email exists.
- Repeated failed attempts are rate-limited.
- Login form is accessible via keyboard and screen reader.

---

## AUTH-003
**Priority:** High
**Epic:** User Authentication
**Title:** Logout

**User Story:** As a logged-in user, I want to log out of my account, so that my session ends and my account stays secure on shared devices.

**Acceptance Criteria:**
- A visible logout action is available from any authenticated page.
- Logging out clears the active session and redirects to the homepage.
- Protected pages are no longer accessible after logout without re-authenticating.

---

## AUTH-004
**Priority:** High
**Epic:** User Authentication
**Title:** Reset Forgotten Password

**User Story:** As a user who forgot my password, I want to reset it via email, so that I can regain access to my account without contacting support.

**Acceptance Criteria:**
- User can request a reset link by submitting their registered email.
- A generic confirmation message is shown regardless of whether the email exists.
- Reset link expires after a limited time window.
- Successful reset allows immediate login with the new password.

---

## AUTH-005
**Priority:** Critical
**Epic:** User Authentication
**Title:** Persist Session Across Page Refreshes

**User Story:** As a logged-in user, I want my session to persist when I refresh or revisit the site, so that I don't have to log in repeatedly.

**Acceptance Criteria:**
- Session remains active after a page refresh within the session validity window.
- Expired or invalid sessions redirect the user to login when accessing protected routes.
- Session state is consistent across browser tabs.

---

## AUTH-006
**Priority:** Medium
**Epic:** User Authentication
**Title:** Manage Account Credentials

**User Story:** As a logged-in user, I want to update my account email and password, so that I can keep my login credentials current and secure.

**Acceptance Criteria:**
- User can change their password after confirming their current password.
- User can update their account email, with confirmation required for the change.
- Changes are validated using the same rules as registration.
- Confirmation feedback is shown after a successful update.

---

# Epic 2 - Property Discovery

## DISC-001
**Priority:** Critical
**Epic:** Property Discovery
**Title:** Browse Property Listings

**User Story:** As a guest, I want to browse a list of available rental properties, so that I can explore what's on the market.

**Acceptance Criteria:**
- Listings display in a grid or list showing primary image, title, location, rent, bedroom count, verification status, and availability.
- Each listing includes a quick-view or details action.
- Results support pagination or infinite scrolling.
- Listings load without requiring an account.

---

## DISC-002
**Priority:** Critical
**Epic:** Property Discovery
**Title:** Search by Location

**User Story:** As a guest, I want to search for properties by location, so that I can find homes in the area I'm interested in.

**Acceptance Criteria:**
- Search accepts partial county or neighborhood matches.
- Search is available prominently on the homepage.
- Matching results update without a full page reload.
- No-match input does not crash the search and returns an empty state.

---

## DISC-003
**Priority:** Critical
**Epic:** Property Discovery
**Title:** Filter Properties

**User Story:** As a guest, I want to filter properties by rent range, property type, bedrooms, and amenities, so that I only see listings relevant to my needs.

**Acceptance Criteria:**
- Filters for minimum/maximum rent, property type, bedroom count, and amenities are available.
- Multiple filters can be combined simultaneously.
- Active filters are reflected in the URL so results can be shared or bookmarked.
- Applying or clearing filters updates results without a full page reload.

---

## DISC-004
**Priority:** Medium
**Epic:** Property Discovery
**Title:** Sort Results

**User Story:** As a guest, I want to sort search results (e.g., by price or newest listed), so that I can prioritize the properties most relevant to me.

**Acceptance Criteria:**
- Sort options include at minimum price ascending/descending and most recently listed.
- Selected sort order persists while filters remain applied.
- Sort applies to the current filtered result set, not the entire catalog.

---

## DISC-005
**Priority:** High
**Epic:** Property Discovery
**Title:** View Featured Properties

**User Story:** As a guest, I want to see a curated set of featured properties on the homepage, so that I can quickly discover trustworthy, high-quality listings.

**Acceptance Criteria:**
- Only verified listings appear in the featured section.
- Featured properties display verification status and key details.
- Featured section is visible without scrolling on desktop and near the top on mobile.

---

## DISC-006
**Priority:** Medium
**Epic:** Property Discovery
**Title:** Handle Empty Search Results

**User Story:** As a guest, I want to see a helpful message when my search or filters return no results, so that I understand why and know what to try next.

**Acceptance Criteria:**
- An empty state message is shown when zero properties match.
- The empty state suggests adjusting filters or broadening the search.
- No error is thrown; the rest of the page (search bar, filters) remains usable.

---

# Epic 3 - Property Details

## PROP-001
**Priority:** Critical
**Epic:** Property Details
**Title:** View Property Details

**User Story:** As a guest, I want to view full details of a property, so that I can decide whether it fits my needs before requesting a viewing.

**Acceptance Criteria:**
- Detail page shows title, description, location, rent, deposit, availability status, last verified date, and assigned agent.
- Page is reachable from any listing card or search result.
- Missing optional fields degrade gracefully without breaking the layout.

---

## PROP-002
**Priority:** High
**Epic:** Property Details
**Title:** Browse Image Gallery

**User Story:** As a guest, I want to browse multiple photos of a property in a gallery, so that I can visually assess the space before visiting.

**Acceptance Criteria:**
- Gallery supports multiple images per property in a defined display order.
- Gallery is responsive across mobile, tablet, and desktop.
- Users can open an image in full-screen view and navigate between images.

---

## PROP-003
**Priority:** High
**Epic:** Property Details
**Title:** View Amenities

**User Story:** As a guest, I want to see the amenities available at a property, so that I can quickly judge if it meets my lifestyle needs.

**Acceptance Criteria:**
- Amenities displayed include parking, borehole, security, WiFi, balcony, furnished status, and pet allowance.
- Amenities not available at the property are visually distinguished from those available.
- Amenity list is visible without needing to expand additional sections.

---

## PROP-004
**Priority:** Critical
**Epic:** Property Details
**Title:** View Verification Status

**User Story:** As a guest, I want to see whether a listing is verified, so that I can trust the accuracy of the information before acting on it.

**Acceptance Criteria:**
- Verification status (Unverified, Pending Verification, Verified, Rejected) is visibly displayed on the details page and listing cards.
- Verified listings show the last verified date.
- Rejected listings are not shown in public search or featured results.

---

## PROP-005
**Priority:** High
**Epic:** Property Details
**Title:** View Agent Information

**User Story:** As a guest, I want to see information about the agent managing a property, so that I know who I'll be dealing with and can trust the listing.

**Acceptance Criteria:**
- Agent name and contact/profile information are displayed on the property details page.
- Agent information is consistent across all listings managed by that agent.
- Missing agent assignment is not possible for a published listing.

---

## PROP-006
**Priority:** High
**Epic:** Property Details
**Title:** View Property Location on Map

**User Story:** As a guest, I want to see a property's location on an interactive map, so that I can understand its surroundings and plan my visit.

**Acceptance Criteria:**
- Map displays the property's approximate or exact location using OpenStreetMap.
- Users can open directions to the property in an external maps application.
- Map loads without blocking the rest of the page content.

---

# Epic 4 - Favorites

## FAV-001
**Priority:** High
**Epic:** Favorites
**Title:** Save a Property

**User Story:** As a customer, I want to save a property to my favorites, so that I can easily find it again later.

**Acceptance Criteria:**
- Save action is available on listing cards and the property details page.
- Only authenticated customers can save properties; guests are prompted to log in or register.
- Saved state is immediately reflected in the UI after saving.

---

## FAV-002
**Priority:** High
**Epic:** Favorites
**Title:** Remove a Saved Property

**User Story:** As a customer, I want to remove a property from my favorites, so that my saved list only reflects properties I'm still interested in.

**Acceptance Criteria:**
- Remove action is available from the favorites page and from the property details page.
- Removal takes effect immediately without a page reload.
- Removed properties no longer appear in the favorites list.

---

## FAV-003
**Priority:** High
**Epic:** Favorites
**Title:** View Saved Properties

**User Story:** As a customer, I want a dedicated page listing all my saved properties, so that I can review and compare them later.

**Acceptance Criteria:**
- Favorites page lists all properties the customer has saved, most recently saved first.
- Each entry shows the same key details as a standard listing card.
- Favorites page shows an empty state when no properties are saved.
- Unavailable or archived saved properties are clearly marked.

---

# Epic 5 - Viewing Requests

## VIEW-001
**Priority:** Critical
**Epic:** Viewing Requests
**Title:** Book a Property Viewing

**User Story:** As a customer, I want to request a viewing directly from a property page, so that I can arrange to see the property in person.

**Acceptance Criteria:**
- Booking action is available on the property details page for available properties only.
- Attempting to book an unavailable property is blocked with an explanatory message.
- Only authenticated customers can submit a booking request.

---

## VIEW-002
**Priority:** Critical
**Epic:** Viewing Requests
**Title:** Select Preferred Date and Time

**User Story:** As a customer, I want to choose my preferred date and time when booking a viewing, so that the agent knows when I'm available.

**Acceptance Criteria:**
- Booking form requires a preferred date and time before submission.
- Past dates cannot be selected.
- An optional notes field is available for additional context.

---

## VIEW-003
**Priority:** Critical
**Epic:** Viewing Requests
**Title:** Receive Booking Confirmation

**User Story:** As a customer, I want to receive confirmation after submitting a viewing request, so that I know it was received and what happens next.

**Acceptance Criteria:**
- A confirmation message is shown immediately after successful submission.
- The new request appears with status "Pending" in the customer's booking history.
- Submission failures show a clear, actionable error message.

---

## VIEW-004
**Priority:** High
**Epic:** Viewing Requests
**Title:** Cancel a Pending Booking

**User Story:** As a customer, I want to cancel a pending viewing request, so that I can back out of a viewing I no longer need.

**Acceptance Criteria:**
- Cancel action is available only on requests in "Pending" or "Confirmed" status.
- Cancelling updates the booking status to "Cancelled" immediately.
- The agent's dashboard reflects the cancellation without delay.

---

## VIEW-005
**Priority:** Medium
**Epic:** Viewing Requests
**Title:** View Booking History

**User Story:** As a customer, I want to see the history of all my viewing requests, so that I can track their status over time.

**Acceptance Criteria:**
- History lists all requests with property, date/time, and current status.
- List is sorted with the most recent request first.
- Status updates (e.g., Confirmed, Completed, Cancelled, No Show) are reflected without requiring a manual refresh.

---

# Epic 6 - Agent Dashboard

## AGENT-001
**Priority:** High
**Epic:** Agent Dashboard
**Title:** View Dashboard Overview

**User Story:** As an agent, I want to see a summary of my properties and viewings on my dashboard, so that I can quickly assess my workload.

**Acceptance Criteria:**
- Dashboard displays total properties, active listings, pending viewings, and completed viewings.
- Figures reflect data scoped to the logged-in agent only.
- Dashboard is the default landing page after agent login.

---

## AGENT-002
**Priority:** Critical
**Epic:** Agent Dashboard
**Title:** Create a New Listing

**User Story:** As an agent, I want to create a new property listing, so that I can advertise it to prospective tenants.

**Acceptance Criteria:**
- Creation form captures all required property data (title, description, location, type, bedrooms, bathrooms, rent, deposit, availability).
- Required fields are validated before submission.
- New listings default to "Unverified" status until reviewed.

---

## AGENT-003
**Priority:** Critical
**Epic:** Agent Dashboard
**Title:** Edit an Existing Listing

**User Story:** As an agent, I want to edit the details of a property I manage, so that its information stays accurate and current.

**Acceptance Criteria:**
- Agent can edit any property they own; edits to other agents' properties are blocked.
- Changes are validated using the same rules as creation.
- Edited listings show an updated "last verified" or "updated at" timestamp where applicable.

---

## AGENT-004
**Priority:** Medium
**Epic:** Agent Dashboard
**Title:** Archive a Listing

**User Story:** As an agent, I want to archive a property that is no longer available, so that it stops appearing in public search results.

**Acceptance Criteria:**
- Archived properties are removed from public search, featured sections, and browsing.
- Archiving does not delete the property record or its history.
- Archived properties remain visible in the agent's own dashboard, clearly labeled.

---

## AGENT-005
**Priority:** Critical
**Epic:** Agent Dashboard
**Title:** Upload Property Images

**User Story:** As an agent, I want to upload and order multiple images for a property, so that prospective tenants can see what it looks like.

**Acceptance Criteria:**
- Agent can upload multiple images per property with alt text.
- Agent can reorder images to control display order.
- Upload failures do not corrupt or remove existing images.

---

## AGENT-006
**Priority:** High
**Epic:** Agent Dashboard
**Title:** Manage Property Availability

**User Story:** As an agent, I want to update a property's availability status, so that customers always see accurate information.

**Acceptance Criteria:**
- Agent can toggle a property between available and unavailable states.
- Marking a property unavailable prevents new viewing requests for it.
- Availability changes are reflected immediately in public listings.

---

## AGENT-007
**Priority:** Critical
**Epic:** Agent Dashboard
**Title:** Verify a Listing

**User Story:** As an agent/admin, I want to review and verify a listing, so that customers can trust the information is accurate.

**Acceptance Criteria:**
- Listing verification status can be set to Unverified, Pending Verification, Verified, or Rejected.
- Only listings with "Verified" status appear in public featured sections.
- Verifying a listing records the verification date.

---

## AGENT-008
**Priority:** Medium
**Epic:** Agent Dashboard
**Title:** View Listing Analytics

**User Story:** As an agent, I want to view basic analytics for my listings, so that I can understand how they are performing.

**Acceptance Criteria:**
- Analytics include at minimum view counts and viewing request counts per property.
- Data is scoped to properties owned by the logged-in agent.
- Analytics are available directly from the dashboard without exporting data.

---

# Epic 7 - Booking Management

## BOOK-001
**Priority:** Critical
**Epic:** Booking Management
**Title:** View Viewing Requests

**User Story:** As an agent, I want to see all viewing requests for my properties, so that I can respond to prospective tenants promptly.

**Acceptance Criteria:**
- List shows customer, property, requested date/time, and current status.
- Requests are filterable by status (Pending, Confirmed, Completed, Cancelled, No Show).
- New requests appear without requiring a manual page refresh.

---

## BOOK-002
**Priority:** Critical
**Epic:** Booking Management
**Title:** Confirm a Booking

**User Story:** As an agent, I want to confirm a pending viewing request, so that the customer knows the viewing is scheduled.

**Acceptance Criteria:**
- Confirm action changes the booking status from "Pending" to "Confirmed".
- The customer sees the updated status without needing to refresh.
- Only pending requests can be confirmed.

---

## BOOK-003
**Priority:** Medium
**Epic:** Booking Management
**Title:** Reschedule a Booking

**User Story:** As an agent, I want to propose a new date and time for a viewing, so that scheduling conflicts can be resolved without cancelling the request.

**Acceptance Criteria:**
- Agent can update the date/time of a Pending or Confirmed booking.
- The customer is notified of the change and sees the new date/time.
- A rescheduled booking retains its original request history/notes.

---

## BOOK-004
**Priority:** High
**Epic:** Booking Management
**Title:** Cancel a Booking

**User Story:** As an agent, I want to cancel a viewing request, so that customers are informed when a viewing cannot proceed.

**Acceptance Criteria:**
- Cancel action changes booking status to "Cancelled".
- Cancelled bookings can optionally include a reason visible to the customer.
- Cancelled bookings no longer appear in the agent's active/pending queue.

---

## BOOK-005
**Priority:** High
**Epic:** Booking Management
**Title:** Mark a Viewing as Completed

**User Story:** As an agent, I want to mark a viewing as completed after it takes place, so that records accurately reflect what happened.

**Acceptance Criteria:**
- Only Confirmed bookings can be marked "Completed".
- Completed bookings move to the customer's and agent's viewing history.
- Status change is reflected in dashboard summary counts.

---

## BOOK-006
**Priority:** Medium
**Epic:** Booking Management
**Title:** Mark a No-Show

**User Story:** As an agent, I want to mark a booking as a no-show when a customer doesn't attend, so that I can keep accurate records of missed viewings.

**Acceptance Criteria:**
- Only Confirmed bookings can be marked "No Show".
- No-show bookings are recorded distinctly from cancellations and completions.
- No-show status is visible in the customer's booking history.

---

# Epic 8 - Customer Dashboard

## CUST-001
**Priority:** High
**Epic:** Customer Dashboard
**Title:** View Upcoming Viewings

**User Story:** As a customer, I want to see my upcoming scheduled viewings, so that I know what's coming up and can plan accordingly.

**Acceptance Criteria:**
- Dashboard lists all Pending and Confirmed viewings sorted by date.
- Each entry shows property, date/time, and status.
- Status updates from the agent appear without a manual refresh.

---

## CUST-002
**Priority:** Medium
**Epic:** Customer Dashboard
**Title:** View Completed Viewings

**User Story:** As a customer, I want to see a history of viewings I've completed, so that I can recall which properties I've already visited.

**Acceptance Criteria:**
- Dashboard lists all Completed and No Show viewings, most recent first.
- Each entry links back to the relevant property details page.
- List is distinct from upcoming viewings.

---

## CUST-003
**Priority:** Medium
**Epic:** Customer Dashboard
**Title:** Manage Profile

**User Story:** As a customer, I want to update my personal profile information, so that agents and the platform have accurate contact details.

**Acceptance Criteria:**
- Customer can edit name, phone number, and other non-credential profile fields.
- Changes are validated before saving.
- Updated information is reflected immediately across the dashboard.

---

## CUST-004
**Priority:** Low
**Epic:** Customer Dashboard
**Title:** Manage Notification Preferences

**User Story:** As a customer, I want to control what notifications I receive, so that I only get updates that matter to me.

**Acceptance Criteria:**
- Customer can toggle notification categories (e.g., booking status changes, promotional updates).
- Preferences are saved and persist across sessions.
- Critical booking confirmations are not fully disable-able, only their delivery channel.

---

# Epic 9 - System Behavior

## SYS-001
**Priority:** Critical
**Epic:** System Behavior
**Title:** Enforce Secure Authentication

**User Story:** As the system, I must authenticate users securely using Supabase Authentication, so that account access is protected against unauthorized use.

**Acceptance Criteria:**
- All authentication flows use Supabase Auth; passwords are never stored or transmitted in plain text.
- Session tokens are securely managed and invalidated on logout.
- Brute-force login attempts are rate-limited.

---

## SYS-002
**Priority:** Critical
**Epic:** System Behavior
**Title:** Enforce Authorization and Access Control

**User Story:** As the system, I must enforce role-based access control and Row Level Security, so that users can only access data and actions permitted for their role.

**Acceptance Criteria:**
- Guests cannot access favorites, bookings, or dashboard routes.
- Customers cannot access agent-only actions (create/edit/verify listings, manage bookings for other customers).
- Agents can only manage properties and bookings they own.
- Database-level Row Level Security policies back up all client-side restrictions.

---

## SYS-003
**Priority:** High
**Epic:** System Behavior
**Title:** Maintain Search Performance

**User Story:** As the system, I must return search results within 2 seconds under normal load, so that users experience a fast, responsive discovery process.

**Acceptance Criteria:**
- Search and filter queries return within 2 seconds under normal load conditions.
- Search supports partial location matching and combinable filters.
- Active filters are reflected in the URL for shareability.

---

## SYS-004
**Priority:** High
**Epic:** System Behavior
**Title:** Optimize Images

**User Story:** As the system, I must optimize and lazy-load property images, so that pages load quickly even on slower mobile connections.

**Acceptance Criteria:**
- Images are served in optimized formats/sizes appropriate to the viewport.
- Below-the-fold images are lazy-loaded.
- Initial page load stays under 3 seconds on a typical 4G connection.

---

## SYS-005
**Priority:** Critical
**Epic:** System Behavior
**Title:** Support Responsive Design

**User Story:** As the system, I must render correctly across mobile phones, tablets, laptops, and desktop monitors, so that all users have a consistent experience regardless of device.

**Acceptance Criteria:**
- All core flows (search, details, booking, dashboards) are fully usable on mobile viewports.
- Layouts adapt without horizontal scrolling or broken elements at common breakpoints.
- Mobile is treated as the primary target for MVP design decisions.

---

## SYS-006
**Priority:** High
**Epic:** System Behavior
**Title:** Handle Errors Gracefully

**User Story:** As the system, I must handle API failures and invalid states gracefully, so that users are never left confused or stuck.

**Acceptance Criteria:**
- Failed requests display user-friendly, actionable error messages, not raw technical errors.
- Transient failures are automatically retried where appropriate.
- No user action results in data loss, particularly during image uploads or booking submission.

---

## SYS-007
**Priority:** Medium
**Epic:** System Behavior
**Title:** Show Loading States

**User Story:** As the system, I must show clear loading indicators during data fetches, so that users understand the platform is working and not frozen.

**Acceptance Criteria:**
- Search, filtering, and page navigation show a visible loading indicator when data is in flight.
- Loading states do not block interaction with unrelated parts of the page.
- Loading indicators are removed promptly once data resolves or errors.

---

## SYS-008
**Priority:** High
**Epic:** System Behavior
**Title:** Meet Accessibility Standards

**User Story:** As the system, I must meet WCAG AA accessibility standards, so that the platform is usable by people with disabilities.

**Acceptance Criteria:**
- Color contrast meets WCAG AA across all core screens.
- All interactive elements are keyboard navigable.
- Forms are screen-reader friendly with proper labels.
- All images include descriptive alt text.

---

## SYS-009
**Priority:** Critical
**Epic:** System Behavior
**Title:** Protect Against Security Vulnerabilities

**User Story:** As the system, I must validate and sanitize all user input, so that the platform is protected against injection, XSS, and other common vulnerabilities.

**Acceptance Criteria:**
- All user-submitted input is validated server-side, not just client-side.
- Rich text content is sanitized before storage or display.
- Dashboard and API routes are protected against unauthorized access attempts.

---

## SYS-010
**Priority:** Medium
**Epic:** System Behavior
**Title:** Maintain Audit Logging

**User Story:** As the system, I must log key actions such as listing verification and booking status changes, so that the platform maintains an accountable record of important events.

**Acceptance Criteria:**
- Verification status changes are logged with actor, timestamp, and prior/new value.
- Booking status changes are logged with actor and timestamp.
- Logs are accessible for troubleshooting but not exposed to end users.

---

# Epic 10 - Future Enhancements

> All stories in this section are marked **Future** and are explicitly out of scope for the MVP, per the [vision document](./vision.md#out-of-scope) and [requirements document](./requirements.md#16-explicitly-deferred-features). They are recorded here for roadmap continuity only.

## FUT-001
**Priority:** Future
**Epic:** Future Enhancements
**Title:** M-Pesa Payments

**User Story:** As a customer, I want to pay rent or deposits via M-Pesa, so that I can complete transactions without leaving the platform.

**Acceptance Criteria:**
- Deferred: no implementation in MVP.
- To be scoped in a future PRD update including provider integration and compliance review.

---

## FUT-002
**Priority:** Future
**Epic:** Future Enhancements
**Title:** Agency Onboarding

**User Story:** As a rental agency, I want to onboard my organization and multiple agents onto the platform, so that we can manage listings collectively.

**Acceptance Criteria:**
- Deferred: no implementation in MVP.
- To be scoped alongside multi-agency support ([FUT-004]).

---

## FUT-003
**Priority:** Future
**Epic:** Future Enhancements
**Title:** Premium Listings

**User Story:** As an agent, I want to pay to feature my listings more prominently, so that I can attract more prospective tenants.

**Acceptance Criteria:**
- Deferred: no implementation in MVP.
- Requires subscription billing infrastructure not present in MVP scope.

---

## FUT-004
**Priority:** Future
**Epic:** Future Enhancements
**Title:** Multi-Agency Support

**User Story:** As a platform operator, I want to support multiple independent agencies with isolated data and branding, so that Rental Hunt KE can scale as a multi-tenant SaaS product.

**Acceptance Criteria:**
- Deferred: no implementation in MVP.
- MVP assumes a single-operator agent/admin model.

---

## FUT-005
**Priority:** Future
**Epic:** Future Enhancements
**Title:** AI-Powered Recommendations

**User Story:** As a customer, I want to receive AI-generated property recommendations based on my preferences and browsing history, so that I can discover relevant listings faster.

**Acceptance Criteria:**
- Deferred: no implementation in MVP.
- To be evaluated after core marketplace metrics are validated.

---

## FUT-006
**Priority:** Future
**Epic:** Future Enhancements
**Title:** Native Mobile Applications

**User Story:** As a user, I want a native iOS/Android app, so that I can use Rental Hunt KE with a fully native mobile experience.

**Acceptance Criteria:**
- Deferred: no implementation in MVP.
- MVP delivers a mobile-first responsive web experience instead.

---

# Epic 11 - Static & Legal Content

> Added post-Sprint-8 (2026-08-05): a documentation-drift review found these pages were never scoped, despite `Footer.tsx` flagging the content gap since Sprint 1. Folded into Sprint 9 (Production Launch) as pre-launch prep scope per `roadmap.md` §13, rather than a dedicated sprint — see `roadmap.md` for placement.

## CONTENT-001
**Priority:** Medium
**Epic:** Static & Legal Content
**Title:** About / How It Works (merged into the homepage)

**User Story:** As a guest, I want to learn what Rental Hunt KE is and how it works, so that I can trust the platform before creating an account.

**Acceptance Criteria:**
- The homepage (`/`) renders a "how it works" walkthrough (search → compare → book a viewing), between the hero and the featured listings.
- **Reworked 2026-08-05:** originally built as a standalone `/about` route (2026-08-05); the developer asked for it to be merged into the homepage instead and the separate route removed — `SearchHero` already covered the platform's mission/tagline and trust badges a dedicated About page would otherwise repeat, so only the "how it works" content was genuinely new and worth keeping.
- Fully static content — no new schema or API contract.

---

## CONTENT-002
**Priority:** Medium
**Epic:** Static & Legal Content
**Title:** Contact / Support Form

**User Story:** As a guest or customer, I want to send a message to the Rental Hunt KE team, so that I can get help or ask a question.

**Acceptance Criteria:**
- A public `/contact` route offers a form (name, email, message), pre-filled with name/email when signed in.
- Submission is stored for admin review; no outbound email is sent (developer decision, 2026-08-05 — admin-review-only for MVP).
- Submission is rate-limited using the same per-user/IP counter pattern already built for viewing-request creation and image upload (`api-design.md` §18).
- Guest submissions cannot spoof another user's `user_id`.

---

## CONTENT-003
**Priority:** Medium
**Epic:** Static & Legal Content
**Title:** Admin Contact Message Review

**User Story:** As an admin, I want to view, resolve, and delete Contact form submissions, so that customer inquiries don't go unanswered.

**Acceptance Criteria:**
- A new admin-dashboard screen lists submissions, newest first, with an unresolved/resolved filter.
- An admin can mark a submission resolved or delete it.
- Only the admin role can read, update, or delete submissions — enforced by RLS, not just UI.

---

## CONTENT-004
**Priority:** Medium
**Epic:** Static & Legal Content
**Title:** Terms of Service & Privacy Policy Pages

**User Story:** As a guest, I want to read the platform's Terms of Service and Privacy Policy, so that I understand my rights, obligations, and what data is collected before using the platform.

**Acceptance Criteria:**
- Public `/terms` and `/privacy` routes exist and are linked from the footer. — **Done 2026-08-06** (`TermsPage.tsx`/`PrivacyPage.tsx`, `Footer.tsx`).
- Legal/company text is supplied by the Product Owner — engineering does not draft binding legal content. — **Superseded 2026-08-06 by explicit developer decision:** engineering drafted boilerplate content customized to this app's actual functionality, as a working starting template — not final, lawyer-drafted legal text. Both pages carry a visible in-app notice saying so, and their own header comments say the same for a future reader. Real legal review remains recommended before this is relied on as binding, but is no longer a hard blocker to shipping the pages.
- Privacy Policy accurately describes real data collection (Supabase Auth, `profiles`, `favorites`, `viewing_requests`, and — once built — `contact_messages`). — **Done 2026-08-06**, and extended to cover what didn't exist when this AC was written: `agencies` (self-service applications, social links) and `reviews` (Epic 12).
- Must exist before Sprint 10's `v1.0.0` production launch tag (`roadmap.md` §14 — corrected 2026-08-06; this line originally said "Sprint 9," written before Sprint 9 was renumbered from Production Launch to Agency Marketplace).

---

## CONTENT-005
**Priority:** Low
**Epic:** Static & Legal Content
**Title:** Genuine 404 Not-Found Page

**User Story:** As a guest who navigates to a URL that doesn't exist, I want a clear "page not found" message, so that I understand the page genuinely doesn't exist rather than being unbuilt.

**Acceptance Criteria:**
- The catch-all route renders a dedicated `NotFoundPage`, not the in-development `PlaceholderPage`.
- Copy is unambiguous ("page not found," not "not yet implemented") and includes a link back to the homepage or `/properties`.
- No schema or API change.

---

# Epic 12 - Agency Marketplace

> Added 2026-08-05, ahead of `FUT-002`/`FUT-004`'s original deferred placement (Epic 10) and `ui-guidelines.md` §23's "public agency profile pages" note. This is a deliberate, explicit developer decision to build self-service agency onboarding, public agency profile pages, and a reviews/ratings system now rather than after `v1.0.0` — see `roadmap.md`'s new Sprint 9 and `decisions.md` ADR-035/ADR-036. Database support: `docs/database.md` §5.3 (`agencies` new columns), new `reviews` table, `agency_rating_summary`/`agent_rating_summary` views.

## AGENCY-001
**Priority:** High
**Epic:** Agency Marketplace
**Title:** Self-Service Agency Registration

**User Story:** As a customer, I want to apply to register my own agency, so that I can start listing properties without waiting for an admin to create my agency first.

**Acceptance Criteria:**
- A signed-in customer can submit an application (name, description, contact info, county, logo URL, social links) from `/register-agency`.
- The application always starts `onboarding_status = 'pending_review'` and is not publicly visible (`is_active = false`), regardless of what the client sends — enforced by a database trigger, not just the UI.
- The applicant can see their own application's status (pending/approved/rejected, with a reason if rejected) on the same page.
- A customer cannot apply on behalf of another user.

---

## AGENCY-002
**Priority:** High
**Epic:** Agency Marketplace
**Title:** Admin Agency Application Review

**User Story:** As an admin, I want to approve or reject a pending agency application, so that only real agencies join the platform.

**Acceptance Criteria:**
- The existing Agencies admin screen shows pending applications with Approve/Reject actions.
- Approving an application atomically: activates the agency, promotes the applicant's role to `agent`, and creates their `agents` row.
- Rejecting an application requires a reason, visible to the applicant.
- Only the admin role may approve/reject — moderator does not have this capability (consistent with Agencies management already being admin-only).

---

## AGENCY-003
**Priority:** High
**Epic:** Agency Marketplace
**Title:** Public Agency Profile Page

**User Story:** As a guest, I want to view an agency's public profile, so that I can see who I'd be renting from, their contact details, and their current listings and agents.

**Acceptance Criteria:**
- `/agencies/:slug` shows the agency's name, description, logo, contact info, social links, and aggregate rating.
- A "Properties" section lists the agency's active, guest-visible listings (same visibility rules as the public search feed), paginated.
- An "Agents" section lists the agency's active agents, each with their own rating.
- The existing admin Agencies table links each agency's name to this same public page.

---

## AGENCY-004
**Priority:** Medium
**Epic:** Agency Marketplace
**Title:** Agency & Agent Reviews and Ratings

**User Story:** As a customer, I want to leave a review and rating after a completed viewing, so that other renters can trust the agency and agent I dealt with.

**Acceptance Criteria:**
- A customer can review a viewing request only once it's `completed`, and only their own.
- One review per completed viewing (enforced by the database, not just the UI).
- A review's agency/agent/property association is derived from the viewing request itself, never entered by the customer.
- The Agency Profile Page shows the agency's average rating and review count, and each listed agent's own average rating.
- An admin can moderate (soft-remove) a review.

---

## AGENCY-005
**Priority:** Medium
**Epic:** Agency Marketplace
**Title:** Admin Overview Drill-Downs

**User Story:** As an admin, I want to click any Overview stat card and see the underlying records in a browsable list, so that I don't have to switch screens to investigate a number.

**Acceptance Criteria:**
- Each of the four Overview stat cards (Total properties, Pending verifications, Active agencies, Bookings this week) links to a real list.
- "Total properties" and "Bookings this week" — previously unbuilt — now have their own admin screens, both offset-paginated 10 rows per page.
- "Pending verifications" and "Active agencies" link to their existing screens, unchanged.

---

# MVP Scope Summary (Version 1.0)

Per the [vision document](./vision.md#minimum-viable-product-mvp), the MVP validates a single hypothesis: people are willing to use a trusted digital platform to discover rental properties and book physical viewings.

| Epic | Included in v1.0 MVP? |
|---|---|
| 1. User Authentication | ✅ Yes |
| 2. Property Discovery | ✅ Yes |
| 3. Property Details | ✅ Yes |
| 4. Favorites | ✅ Yes |
| 5. Viewing Requests | ✅ Yes |
| 6. Agent Dashboard | ✅ Yes |
| 7. Booking Management | ✅ Yes |
| 8. Customer Dashboard | ✅ Yes |
| 9. System Behavior | ✅ Yes (cross-cutting, applies to all epics above) |
| 10. Future Enhancements | ❌ No — explicitly deferred (except `FUT-002`/`FUT-004`'s onboarding/multi-agency-page pieces, superseded early by Epic 12, 2026-08-05) |
| 11. Static & Legal Content | ✅ Yes (folded into Sprint 9 pre-launch prep) |
| 12. Agency Marketplace | ✅ Yes (added 2026-08-05, ahead of its original post-MVP placement — `roadmap.md`'s new Sprint 9) |

---

# Story-to-Epic Traceability Table

| Story ID | Epic | Related Requirement(s) |
|---|---|---|
| AUTH-001 | User Authentication | FR-AUTH-001 |
| AUTH-002 | User Authentication | FR-AUTH-002 |
| AUTH-003 | User Authentication | FR-AUTH-002 |
| AUTH-004 | User Authentication | FR-AUTH-003 |
| AUTH-005 | User Authentication | FR-AUTH-004 |
| AUTH-006 | User Authentication | FR-AUTH-001, FR-AUTH-002 |
| DISC-001 | Property Discovery | FR-HOME-001, FR-HOME-004, FR-SEARCH-007, FR-LIST-001–008 |
| DISC-002 | Property Discovery | FR-HOME-001, FR-SEARCH-001, NFR-SEARCH-002 |
| DISC-003 | Property Discovery | FR-SEARCH-002, FR-SEARCH-003, FR-SEARCH-004, FR-SEARCH-005, FR-SEARCH-006, NFR-SEARCH-003, NFR-SEARCH-004 |
| DISC-004 | Property Discovery | FR-SEARCH-006 |
| DISC-005 | Property Discovery | FR-HOME-002, FR-HOME-003, FR-DASH-011 |
| DISC-006 | Property Discovery | FR-SEARCH-006 |
| PROP-001 | Property Details | FR-PROP-001–008 |
| PROP-002 | Property Details | FR-PROP-009, FR-PROP-010, FR-PROP-011 |
| PROP-003 | Property Details | FR-PROP-012 |
| PROP-004 | Property Details | FR-LIST-006, FR-PROP-007, FR-DASH-010 |
| PROP-005 | Property Details | FR-PROP-008 |
| PROP-006 | Property Details | FR-PROP-013, FR-PROP-014, FR-PROP-015 |
| FAV-001 | Favorites | FR-FAV-001 |
| FAV-002 | Favorites | FR-FAV-002 |
| FAV-003 | Favorites | FR-FAV-003, FR-CUST-001 |
| VIEW-001 | Viewing Requests | FR-BOOK-001, FR-BOOK-003 |
| VIEW-002 | Viewing Requests | FR-BOOK-002 |
| VIEW-003 | Viewing Requests | FR-BOOK-004 |
| VIEW-004 | Viewing Requests | FR-BOOK-005 |
| VIEW-005 | Viewing Requests | FR-BOOK-006, FR-CUST-002, FR-CUST-003 |
| AGENT-001 | Agent Dashboard | FR-DASH-001, FR-DASH-002, FR-DASH-003, FR-DASH-004 |
| AGENT-002 | Agent Dashboard | FR-DASH-005 |
| AGENT-003 | Agent Dashboard | FR-DASH-006 |
| AGENT-004 | Agent Dashboard | FR-DASH-007 |
| AGENT-005 | Agent Dashboard | FR-DASH-008 |
| AGENT-006 | Agent Dashboard | FR-DASH-009 |
| AGENT-007 | Agent Dashboard | FR-DASH-010, FR-DASH-011 |
| AGENT-008 | Agent Dashboard | — (secondary objective: professional agent tooling) |
| BOOK-001 | Booking Management | FR-DASH-003, FR-DASH-004 |
| BOOK-002 | Booking Management | FR-BOOK-005 |
| BOOK-003 | Booking Management | FR-BOOK-005 |
| BOOK-004 | Booking Management | FR-BOOK-005 |
| BOOK-005 | Booking Management | FR-BOOK-005 |
| BOOK-006 | Booking Management | FR-BOOK-005 |
| CUST-001 | Customer Dashboard | FR-CUST-002, FR-BOOK-006 |
| CUST-002 | Customer Dashboard | FR-CUST-003 |
| CUST-003 | Customer Dashboard | FR-CUST-004 |
| CUST-004 | Customer Dashboard | FR-CUST-005 |
| SYS-001 | System Behavior | FR-AUTH-002, 13.2 Security |
| SYS-002 | System Behavior | FR-AUTH-005, FR-BOOK-003, 13.2 Security |
| SYS-003 | System Behavior | NFR-SEARCH-001–004 |
| SYS-004 | System Behavior | 13.1 Performance |
| SYS-005 | System Behavior | 13.5 Responsiveness |
| SYS-006 | System Behavior | 13.3 Reliability |
| SYS-007 | System Behavior | 13.1 Performance, 13.3 Reliability |
| SYS-008 | System Behavior | 13.4 Accessibility |
| SYS-009 | System Behavior | 13.2 Security |
| SYS-010 | System Behavior | 13.2 Security (accountability) |
| FUT-001 | Future Enhancements | Explicitly Deferred Features — M-Pesa checkout |
| FUT-002 | Future Enhancements | Long-Term Vision — Agency onboarding |
| FUT-003 | Future Enhancements | Long-Term Vision — Featured/premium listings |
| FUT-004 | Future Enhancements | Explicitly Deferred Features — Multi-agency SaaS support |
| FUT-005 | Future Enhancements | Explicitly Deferred Features — AI property recommendations |
| FUT-006 | Future Enhancements | Explicitly Deferred Features — Native iOS/Android apps |
| CONTENT-001 | Static & Legal Content | FR-CONTENT-001 |
| CONTENT-002 | Static & Legal Content | FR-CONTENT-002 |
| CONTENT-003 | Static & Legal Content | FR-CONTENT-003 |
| CONTENT-004 | Static & Legal Content | FR-CONTENT-004 |
| CONTENT-005 | Static & Legal Content | FR-CONTENT-005 |
| AGENCY-001 | Agency Marketplace | FR-AGENCY-001 |
| AGENCY-002 | Agency Marketplace | FR-AGENCY-002 |
| AGENCY-003 | Agency Marketplace | FR-AGENCY-003 |
| AGENCY-004 | Agency Marketplace | FR-AGENCY-004 |
| AGENCY-005 | Agency Marketplace | FR-AGENCY-005 |

---

This document is the single source of truth for user-facing and system behavior scope in the Rental Hunt KE MVP, and should be kept in sync with `requirements.md` as scope evolves.
