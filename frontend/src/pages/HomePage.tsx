import { FeaturedListings, SearchHero } from '@/widgets';

// DISC-005: the featured section is composed directly below the hero so it
// stays visible without scrolling on desktop and near the top on mobile —
// a page-layout concern, not something FeaturedListings itself decides.
function HomePage() {
  return (
    <div className="flex flex-col">
      <SearchHero />
      <FeaturedListings />
    </div>
  );
}

export { HomePage };
