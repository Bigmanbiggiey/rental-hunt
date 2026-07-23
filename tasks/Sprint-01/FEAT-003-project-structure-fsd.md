# FEAT-003 — Project Structure (FSD)

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Reviewed — substantially absorbed by FEAT-001; one requirement remains open (see §4)
> **Priority:** Critical
> **Derived from:** `docs/coding-standards.md` §3 (Project Organization) and `docs/roadmap.md` §5's "Folder structure" bullet. Like FEAT-001, no pre-existing task file existed under this ID — this document was drafted during the FEAT-001 review pass (2026-07-21) at the user's request, to review the FSD structure work already completed against its own explicit requirements rather than assume it.

---

## 1. Objective

Establish and enforce Feature-Sliced Design as the project's structural architecture: the folder layout itself, the downward-only import direction between layers, and the prohibition on sibling features importing each other — per `coding-standards.md` §3.1–§3.3.

---

## 2. Requirements (from `coding-standards.md` §3)

1. The `src/` folder tree exists: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`, `routes/`, `assets/`, `styles/` (§3).
2. Layer ownership boundaries are respected (§3.1) — not independently checkable until real code exists in each layer, but the folder split must exist to make it checkable at all.
3. The import-direction rule (§3.2) is enforced by tooling, not convention alone: a layer may import only from itself or layers below it (`app → pages → widgets → features → entities → shared`), never upward, never sideways between sibling features.
4. **Sibling features never import each other.** If two features need the same logic, it is extracted into `entities/` or `shared/` (§3.2, explicit clause).
5. `import/no-cycle` (or equivalent) is enabled project-wide as an independent guard against cycles the layer rule doesn't catch (§3.3).
6. Folder naming conventions are followed as slices are added (§5): lowercase, kebab-case for multi-word folders; feature folders named after the user-facing capability; entity folders always singular.

## 3. Review Against Actual Implementation (2026-07-21)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | `src/` FSD folder tree exists | ✅ Done | `frontend/src/{app,pages,widgets,features,entities,shared,routes,assets,styles}/` created in FEAT-001, each non-`assets`/`styles` folder with a placeholder `index.ts` barrel. |
| 2 | Layer ownership boundaries respected | ✅ Not yet violable | No real feature/entity code exists yet to check against §3.1's "must not contain" column — nothing to flag, but nothing contradicts it either. |
| 3 | Import-direction rule enforced by tooling | ✅ Done | `frontend/eslint.config.js`'s `boundaries/dependencies` rule (via `eslint-plugin-boundaries`), verified in FEAT-001 by deliberately introducing and lint-checking a cross-layer violation (`entities` importing `app`), confirming it was caught, then removing the test file. See ADR-021. |
| 4 | Sibling features never import each other | ❌ **Not done** | The coarse layer-direction rule (item 3) does not distinguish between features — it would currently allow `features/authentication` to import `features/property-search`. This requires a capture-based rule keyed on the feature's slice name, which needs at least two real feature folders to test meaningfully. Tracked as technical debt (`docs/project-state.md` Technical Debt table) rather than implemented speculatively. |
| 5 | `import/no-cycle` equivalent enabled | ✅ Done | `import-x/no-cycle` (the maintained fork of `eslint-plugin-import`, since the original doesn't yet support ESLint 10 — see ADR-020) is set to `error` in `frontend/eslint.config.js`. |
| 6 | Folder naming conventions followed | — Not yet applicable | No feature/entity slices exist yet to name; nothing to check until the first real slice is added (expected Sprint 2, `AUTH-*`). |

## 4. Remaining Requirements (not implemented — listed only, per this review's scope)

- **Sibling-feature import isolation** (§3.2's explicit clause, item 4 above). Needs a capture-based `eslint-plugin-boundaries` rule keyed on the feature slice name (e.g. `pattern: 'src/features/*/**'`, `capture: ['feature']`), verified against at least two real feature folders. Cannot be meaningfully tested with zero or one feature slice in the repo today. **Not implemented in this review — left for the Sprint 2 ticket that adds the second real feature.**

No other gaps were identified. This is the only requirement in FEAT-003's scope not already satisfied by FEAT-001's work.
