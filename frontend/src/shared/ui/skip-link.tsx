/**
 * ui-guidelines.md §17 — "A 'Skip to main content' link is the first
 * focusable element on every page." Visually hidden until focused (the
 * standard bypass-blocks pattern, WCAG 2.4.1) so it never appears for
 * mouse/touch users but is the very first Tab stop for keyboard users.
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only rounded-md px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus-visible:ring-2 focus-visible:outline-none"
    >
      Skip to main content
    </a>
  );
}
