import { Alert, AlertDescription } from '@/shared/ui';

const LAST_UPDATED = '6 August 2026';

// CONTENT-004 (Sprint 10, added 2026-08-06). Same caveat as TermsPage.tsx —
// a boilerplate template customized to what this app actually collects
// (verified against database.md §5: profiles, favorites, viewing_requests,
// contact_messages, agencies/reviews added by Epic 12), not final legal
// text. Needs developer/legal review before v1.0.0.
function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-h1 text-foreground font-semibold">Privacy Policy</h1>
        <p className="text-body-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <Alert>
        <AlertDescription>
          This is a template drafted for Rental Hunt KE&apos;s actual data collection and has not yet
          been reviewed by a lawyer. It should be reviewed and approved before being relied on as a
          binding policy.
        </AlertDescription>
      </Alert>

      <div className="text-body text-foreground flex max-w-prose flex-col gap-6">
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">1. What we collect</h2>
          <p>We collect only what&apos;s needed to run the platform:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Account details</strong> — your email and password (handled by our
              authentication provider, Supabase Auth; we never see your password in plain text), full
              name, phone number, and profile photo if you add one.
            </li>
            <li>
              <strong>Notification preferences</strong> — your choices about what updates you want to
              receive.
            </li>
            <li>
              <strong>Saved properties</strong> — listings you&apos;ve favorited.
            </li>
            <li>
              <strong>Viewing requests</strong> — the property, requested date/time, status, and any
              notes you add when booking or cancelling a viewing.
            </li>
            <li>
              <strong>Agency applications</strong> — if you apply to register an agency: the agency
              name, description, contact details, and any social media links you provide.
            </li>
            <li>
              <strong>Reviews</strong> — the rating and comment you leave after a completed viewing.
            </li>
            <li>
              <strong>Contact messages</strong> — your name, email, and message if you use our Contact
              form.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">2. How we use it</h2>
          <p>
            We use this information to operate the platform: authenticate you, show you relevant
            listings, connect you with agents for viewings, let agencies and admins review each
            other&apos;s submissions (listings, agency applications), and respond to your messages. We
            don&apos;t sell your personal data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">3. Who can see what</h2>
          <p>
            Your reviews are shown publicly, but attributed only as &quot;Verified renter&quot; — we
            don&apos;t display your name or profile alongside a review. Agents can see the name and
            phone number of a customer who has booked a viewing with them, and nothing else. Your
            favorites and cancelled/completed booking history are private to you. Access to every
            table is enforced by database-level row security, not just by what the app&apos;s screens
            show.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">4. Where it&apos;s stored</h2>
          <p>
            Data is stored with Supabase, our database and authentication provider. We don&apos;t
            operate our own servers for this data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">5. Your choices</h2>
          <p>
            You can update your profile details, change your notification preferences, remove
            favorites, and cancel pending/confirmed viewing requests at any time from your dashboard.
            To delete your account or request a copy of your data, contact us through the Contact
            page.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">6. Cookies and tracking</h2>
          <p>
            We use only the storage necessary to keep you signed in (your session token). We don&apos;t
            currently use third-party advertising or analytics trackers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">7. Changes to this policy</h2>
          <p>
            We may update this policy as the platform changes. We&apos;ll update the date at the top of
            this page when we do.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">8. Contact</h2>
          <p>Questions about this policy or your data? Reach us through the Contact page.</p>
        </section>
      </div>
    </div>
  );
}

export { PrivacyPage };
