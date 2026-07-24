// Minimal by design — no footer link/content spec exists in ui-guidelines.md yet
// (see FEAT-010's Out of Scope). Expand once that content is actually decided.
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-surface border-t">
      <div className="text-muted-foreground text-body-sm mx-auto max-w-7xl px-4 py-8 sm:px-6">
        © {year} Rental Hunt KE. All rights reserved.
      </div>
    </footer>
  );
}

export { Footer };
