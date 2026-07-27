// ui-guidelines.md §12.6 — "KES 45,000 / month" on cards, thousands-separated,
// currency always explicit. Full rent+deposit breakdown is a detail-page
// (PROP-001, Sprint 4) concern, not built here.
export function PriceDisplay({ amount, currency }: { amount: number; currency: string }) {
  const formatted = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount);
  return (
    <span className="text-body font-semibold text-foreground">
      {currency} {formatted} <span className="font-normal text-muted-foreground">/ month</span>
    </span>
  );
}
