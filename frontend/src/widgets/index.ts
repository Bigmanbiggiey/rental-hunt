// Dashboard layout widgets (admin/moderator/agent/user, + the shared
// dashboard-shell they're built on) are deliberately NOT re-exported here —
// Sprint 8 found that barrel-importing role-gated widgets like these drags
// them into unrelated eager bundles. `routes.tsx` imports each directly via
// its own subpath (`@/widgets/admin-dashboard-layout`, etc.), lazy-loaded.
export * from './layout';
export * from './search-hero';
export * from './featured-listings';
export * from './property-grid';
export * from './related-properties';
