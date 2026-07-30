import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PropertyAnalytics } from '../repositories/agent-analytics.repository';
import { PropertyAnalyticsChart } from './PropertyAnalyticsChart';

const DATA: PropertyAnalytics[] = [
  { propertyId: 'p1', title: 'Test 2BR in Kilimani', viewCount: 12, viewingRequestCount: 3 },
  { propertyId: 'p2', title: 'Test Studio in Westlands', viewCount: 4, viewingRequestCount: 1 },
];

// AGENT-008. `PropertyAnalyticsChartCanvas` (recharts) is lazy-loaded behind
// a Suspense boundary — this is a smoke test proving the boundary resolves
// and both single-series charts' headings render (ui-guidelines.md §13.5:
// never one dual-axis combo). recharts' own internal SVG measurement isn't
// asserted on — jsdom has no real layout engine, so `ResponsiveContainer`'s
// pixel output isn't meaningful to test here.
describe('PropertyAnalyticsChart (component)', () => {
  it('lazy-loads and renders both single-series chart headings', async () => {
    render(<PropertyAnalyticsChart data={DATA} />);

    // A generous timeout — the first test in the process to hit this lazy
    // import pays for its actual compilation, not just module resolution.
    expect(await screen.findByText('Views per property', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Viewing requests per property')).toBeInTheDocument();
  });

  it('renders both headings even with no property data yet', async () => {
    render(<PropertyAnalyticsChart data={[]} />);

    // A generous timeout — the first test in the process to hit this lazy
    // import pays for its actual compilation, not just module resolution.
    expect(await screen.findByText('Views per property', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Viewing requests per property')).toBeInTheDocument();
  });
});
