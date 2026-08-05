import { Link } from 'react-router';
import { CalendarCheck, Eye, Search, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/shared/ui';
import { PATHS } from '@/shared/config';

// CONTENT-001. Public, unauthenticated equivalent of the same "tagline + how
// it works" content `UserDashboardOverviewPage`'s welcome block already
// established post-login (branding.md's Tagline/Brand Promise; wording for
// the three steps is that page's own, reused verbatim here rather than
// re-invented) — this is the guest-reachable version, since a guest never
// sees that page at all.
const HOW_IT_WORKS = [
  { icon: Search, label: 'Search', description: 'Filter by neighborhood, price, and bedrooms.' },
  { icon: Eye, label: 'Compare', description: 'View full listing details, photos, and the map.' },
  { icon: CalendarCheck, label: 'Book a Viewing', description: 'Request a viewing straight from the listing.' },
] as const;

function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-h1 text-foreground font-bold">Find your next home with confidence.</h1>
        <p className="text-body text-muted-foreground">
          Rental Hunt KE connects you with verified listings from legitimate agents — no wasted time,
          no surprises.
        </p>
      </div>

      <section aria-labelledby="how-it-works-heading" className="flex flex-col gap-4">
        <h2 id="how-it-works-heading" className="text-h2 text-foreground font-semibold">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, label, description }) => (
            <div key={label} className="border-border flex flex-col gap-1 rounded-lg border p-4">
              <Icon className="text-primary size-5" aria-hidden="true" />
              <p className="text-body text-foreground font-semibold">{label}</p>
              <p className="text-body-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button asChild size="lg">
          <Link to={PATHS.public.properties}>Browse Properties</Link>
        </Button>
        <div className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Verified Listings
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4" aria-hidden="true" />
            Legitimate Agents
          </span>
        </div>
      </div>
    </div>
  );
}

export { AboutPage };
