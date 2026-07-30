/**
 * Title → URL-safe slug + a short random uniqueness suffix, matching seed
 * data's existing slug shape (e.g. `2br-apartment-kilimani-a1`).
 * `properties.slug` has a unique constraint (database.md §5.2) — the random
 * suffix means two listings with an identical title never collide on create.
 */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
