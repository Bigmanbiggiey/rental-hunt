// ui-guidelines.md §12.6's detail-page "full breakdown" variant — a
// different anatomy from PriceDisplay's one-line card format (two labeled
// lines vs. one), so a separate small component beats a mode-flag prop on
// the existing one.
export function PriceBreakdown({
  rentAmount,
  depositAmount,
  currency,
}: {
  rentAmount: number;
  depositAmount: number;
  currency: string;
}) {
  const format = (amount: number) =>
    new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="flex flex-col gap-1 text-body">
      <p className="font-semibold text-foreground">
        Rent: {currency} {format(rentAmount)}/mo
      </p>
      <p className="text-muted-foreground">
        Deposit: {currency} {format(depositAmount)}
      </p>
    </div>
  );
}
