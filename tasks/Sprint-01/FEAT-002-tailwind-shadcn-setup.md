# FEAT-002 — Tailwind CSS v4 + shadcn/ui Setup

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-21
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Initialize bullet: "Tailwind CSS v4 + shadcn/ui (with the design tokens from `ui-guidelines.md` §21 wired into the `@theme` block)." As with FEAT-001/003/004, no pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Wire up Tailwind CSS v4 and shadcn/ui as the project's styling system, with the exact design tokens from `ui-guidelines.md` §21 driving every color/spacing/radius/shadow/motion utility — closing the one still-open Sprint 1 Definition-of-Done item, "`npm run dev` runs the app locally, themed with `ui-guidelines.md`'s tokens (not default Tailwind)."

## 2. In Scope

- `tailwindcss` + `@tailwindcss/vite` installed; the Vite plugin wired into `vite.config.ts`.
- `frontend/src/styles/index.css` rewritten as the Tailwind v4 entry point (`@import 'tailwindcss';`) with the full `@theme` token block from `ui-guidelines.md` §21, plus the dark-mode override block (`:root[data-theme='dark']`, values from §4.1/§4.5 — defined but unused, matching the doc's explicit "kept ready but unused until dark mode ships" instruction).
- A `@/` → `src/` path alias (`tsconfig.app.json`, root `tsconfig.json` for external-tool discovery, and `vite.config.ts`'s `resolve.alias`) — required by shadcn/ui's generated component imports.
- shadcn/ui initialized via a hand-authored `components.json` (style `new-york`, base color `neutral`, Radix primitives, CSS variables, Lucide icons) targeting `shared/ui`/`shared/lib` per `coding-standards.md` §3.1 — not the CLI's default `@/components`/`@/lib` paths.
- One primitive installed as an end-to-end proof: `Button` (`shared/ui/button.tsx`) plus its `cn()` utility (`shared/lib/utils.ts`), each with an `index.ts` barrel, wired into the top-level `shared/index.ts`.
- `App.tsx` updated to a themed (not default-Tailwind) shell using real tokens (`bg-background`, `text-foreground`, `text-h1`, `text-muted-foreground`) and the real `Button` component — the concrete proof the Sprint 1 DoD item asks for.
- Two small, documented fixes to `ui-guidelines.md` §21 itself: the missing `--color-card-foreground` (already decided in §4.1, just not transcribed into §21's cheat-sheet) and new `--color-card`/`--color-destructive`(`-foreground`) aliases (identical values to `--color-surface`/`--color-error`(`-foreground`)) since shadcn/ui's vendor component code uses those exact class names. See ADR-024.

## 3. Explicitly Out of Scope

- The Supabase client, TanStack Query, React Router, React Hook Form + Zod.
- CI/CD (GitHub Actions, Vercel).
- The real base layout/navigation shell (header/footer, nav, mobile drawer) — `App.tsx`'s themed shell here is a token/component proof, not the real page chrome from `ui-guidelines.md` §7/§15.
- Any component beyond `Button` — further primitives are installed as later work needs them, per `coding-standards.md` §2's "no abstraction for a case that doesn't exist yet."
- Dark mode itself (toggle, cross-screen QA) — out of MVP scope per `ui-guidelines.md` §4.5/§23; only the token values are defined, unused.

## 4. Notable Implementation Details

- The installed shadcn CLI (`shadcn@4.13.1`) is a substantially newer, preset-driven tool than the classic CLI (`-b radix` for the component-library base, 8 named design presets none of which matched our own fully-specified tokens). Used the classic `style: "new-york"` / `baseColor: "neutral"` combination instead of a preset — it generates components referencing the standard semantic class names (`bg-primary`, `bg-card`, `bg-destructive`, etc.) that map directly onto our own token names.
- The CLI initially failed to resolve the `@/` alias (it only reads the root `tsconfig.json`, not the referenced `tsconfig.app.json` where the alias actually lived) and created a stray literal `@/shared/ui/button.tsx` folder at the project root. Fixed by also declaring `paths` in the root `tsconfig.json` (a no-op for the actual build, which still resolves through `tsconfig.app.json`, but needed for external tool discovery); deleted the stray folder and re-ran.
- The CLI's dependency installation was inconsistent across commands: `class-variance-authority` (imported by `button.tsx`) wasn't auto-installed and had to be added manually; `clsx`/`tailwind-merge` were correctly auto-installed when adding the `utils` registry item.
- Tailwind v4's `@theme` tokens are tree-shaken — a token unused by any utility class actually present in the compiled source doesn't emit a CSS variable. This is expected content-aware behavior, not a bug; verified by checking that `--color-primary`'s real light-mode hex (`#1e3a5f`) appears in the built CSS only once `Button` (which uses `bg-primary`) was added to `App.tsx`.

## 5. Definition of Done

- [x] Tailwind CSS v4 installed and wired into Vite.
- [x] `styles/index.css` contains the full `ui-guidelines.md` §21 token set (plus the two documented additions) as a Tailwind `@theme` block.
- [x] shadcn/ui initialized, targeting `shared/ui`/`shared/lib` per FSD.
- [x] `Button` installed and rendered in `App.tsx` using real design tokens — `npm run dev` now shows a themed shell, not default Tailwind/shadcn gray-scale.
- [x] `npm run lint` — zero errors (one expected, harmless `react-refresh/only-export-components` warning on the vendor `button.tsx`, not hand-edited).
- [x] `npm run typecheck` — clean.
- [x] `npm run build` — succeeds; compiled CSS verified (via `grep`) to contain the real token hex values, not placeholders.
- [x] FSD import-boundary lint rule re-verified against the new `shared/ui`/`shared/lib` subfolders (a throwaway cross-layer violation was created, confirmed caught, then deleted).
- [x] `ui-guidelines.md` §21 corrected in the same change (missing token + new aliases), per `CLAUDE.md` §8.
- [x] `docs/project-state.md` updated; Sprint 1 DoD's "themed empty shell" item checked off.
