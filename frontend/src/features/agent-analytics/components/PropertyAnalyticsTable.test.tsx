import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { PropertyAnalytics } from '../repositories/agent-analytics.repository';
import { PropertyAnalyticsTable } from './PropertyAnalyticsTable';

const DATA: PropertyAnalytics[] = [
  { propertyId: 'p1', title: 'Test 2BR in Kilimani', viewCount: 12, viewingRequestCount: 3 },
  { propertyId: 'p2', title: 'Test Studio in Westlands', viewCount: 4, viewingRequestCount: 1 },
];

/** AGENT-008 — the always-visible accessible alternative to the chart (ui-guidelines.md §13.5). */
describe('PropertyAnalyticsTable (component)', () => {
  it('renders one row per property with its view and viewing-request counts', () => {
    render(<PropertyAnalyticsTable data={DATA} />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 data rows

    const firstRow = rows[1]!;
    expect(within(firstRow).getByText('Test 2BR in Kilimani')).toBeInTheDocument();
    expect(within(firstRow).getByText('12')).toBeInTheDocument();
    expect(within(firstRow).getByText('3')).toBeInTheDocument();
  });

  it('renders only the header row when there is no data', () => {
    render(<PropertyAnalyticsTable data={[]} />);

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(1);
  });
});
