import { Alert, AlertDescription } from '@/shared/ui';

const LAST_UPDATED = '6 August 2026';

// CONTENT-004 (Sprint 10, added 2026-08-06). This is a boilerplate template
// customized to Rental Hunt KE's real functionality (property discovery,
// viewing requests, agency self-service onboarding, reviews) — not
// lawyer-drafted final legal text. Per the developer's own decision, it's
// built now as a working starting point; it must be reviewed and approved
// by the developer (and, ideally, real legal counsel) before it's treated
// as binding, and before the v1.0.0 launch tag.
function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-h1 text-foreground font-semibold">Terms of Service</h1>
        <p className="text-body-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <Alert>
        <AlertDescription>
          This is a template drafted for Rental Hunt KE&apos;s actual features and has not yet been
          reviewed by a lawyer. It should be reviewed and approved before being relied on as a binding
          agreement.
        </AlertDescription>
      </Alert>

      <div className="text-body text-foreground flex max-w-prose flex-col gap-6">
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">1. Acceptance of terms</h2>
          <p>
            By creating an account or using Rental Hunt KE (&quot;the platform&quot;), you agree to these
            Terms of Service. If you don&apos;t agree, please don&apos;t use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">2. What Rental Hunt KE does</h2>
          <p>
            Rental Hunt KE is a discovery platform that connects prospective tenants with rental
            listings managed by agencies and their agents. We help you search, compare, and request
            viewings. We are not a party to any tenancy agreement, deposit, or rent payment between
            you and an agency or landlord.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">3. Accounts</h2>
          <p>
            You need an account to save properties, request viewings, or register an agency. You&apos;re
            responsible for keeping your password secure and for activity under your account. Roles on
            the platform are: <strong>Customer</strong> (searches and books viewings), <strong>Agent</strong>{' '}
            (manages listings for one agency), <strong>Moderator</strong> (reviews listings for
            accuracy), and <strong>Admin</strong> (platform administration, including reviewing agency
            applications).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">4. Agencies and listings</h2>
          <p>
            Anyone with a customer account may apply to register an agency. Applications are reviewed
            by an admin before the agency becomes active and before the applicant gains agent access.
            Agencies and agents are responsible for the accuracy of the listings, contact details, and
            social links they publish. A &quot;Verified&quot; badge on a listing means it passed our
            moderation review, not that we&apos;ve independently confirmed ownership, legal status, or
            physical condition of the property.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">5. Viewing requests</h2>
          <p>
            Requesting a viewing sends your request to the property&apos;s agent. Confirmation,
            rescheduling, and cancellation happen between you and the agent through the platform. We
            don&apos;t guarantee an agent will respond within any particular timeframe.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">6. Reviews</h2>
          <p>
            You may leave one rating and review per viewing you&apos;ve completed. Reviews must reflect
            your genuine experience. We may remove a review that violates these terms (e.g. it&apos;s
            abusive, fraudulent, or unrelated to the actual viewing).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">7. Acceptable use</h2>
          <p>
            Don&apos;t use the platform to post false listings, impersonate someone else, scrape or
            misuse other users&apos; data, or attempt to bypass our security controls.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">8. Disclaimers and liability</h2>
          <p>
            The platform is provided &quot;as is.&quot; We don&apos;t guarantee that any listing is
            available, accurately described, or free of errors. To the extent permitted by Kenyan law,
            Rental Hunt KE is not liable for disputes, losses, or damages arising from a tenancy
            arrangement made through the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">9. Changes to these terms</h2>
          <p>
            We may update these terms as the platform changes. Continued use after an update means you
            accept the revised terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold">10. Contact</h2>
          <p>Questions about these terms? Reach us through the Contact page.</p>
        </section>
      </div>
    </div>
  );
}

export { TermsPage };
