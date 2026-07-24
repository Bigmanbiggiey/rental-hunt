interface PlaceholderPageProps {
  title: string;
}

// Stands in for every route until the sprint that owns it builds the real page.
// The `<main>` landmark belongs to AppLayout (FEAT-010), not this component.
function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-h1 text-foreground font-semibold">{title}</h1>
      <p className="text-body text-muted-foreground">Route skeleton — page not yet implemented.</p>
    </div>
  );
}

export { PlaceholderPage };
