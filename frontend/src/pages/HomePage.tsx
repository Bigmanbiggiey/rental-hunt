import { CalendarCheck, Eye, Search } from 'lucide-react';
import { FeaturedListings, SearchHero } from '@/widgets';

// CONTENT-001 (reworked 2026-08-05): this "How it works" section used to be
// AboutPage.tsx, a separate /about route — merged directly into the
// homepage instead, since SearchHero already covers the tagline and trust
// badges AboutPage also had, leaving this 3-step grid as the only content
// that wasn't already on this page. Wording matches
// UserDashboardOverviewPage's post-login welcome block (that page's own
// comment explains why: same explanation, guest-reachable version here
// since a guest never sees that page at all).
const HOW_IT_WORKS = [
  { icon: Search, label: 'Search', description: 'Filter by neighborhood, price, and bedrooms.' },
  { icon: Eye, label: 'Compare', description: 'View full listing details, photos, and the map.' },
  { icon: CalendarCheck, label: 'Book a Viewing', description: 'Request a viewing straight from the listing.' },
] as const;

// DISC-005: the featured section is composed directly below the hero so it
// stays visible without scrolling on desktop and near the top on mobile —
// a page-layout concern, not something FeaturedListings itself decides.
function HomePage() {
  return (
    <div className="flex flex-col">
      <SearchHero />

      <section aria-labelledby="how-it-works-heading" className="flex flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
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

      <FeaturedListings />
    </div>
  );
}

export { HomePage };
