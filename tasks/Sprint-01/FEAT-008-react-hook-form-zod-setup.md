# FEAT-008 — React Hook Form + Zod Setup

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-22
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Initialize bullet: "React Hook Form + Zod (verified with one throwaway form to confirm the `zodResolver` wiring works end-to-end)." No pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Install React Hook Form, Zod, and `@hookform/resolvers`, and prove the `useForm({ resolver: zodResolver(Schema) })` pipeline (`coding-standards.md` §12) actually works against this project's exact dependency versions — catching any real version-compatibility gap now, rather than when Sprint 2 builds the first real form (`AUTH-001` Registration).

## 2. In Scope

- `react-hook-form`, `zod`, `@hookform/resolvers` installed as direct dependencies (`zod` previously only present transitively via `eslint-plugin-react-hooks`'s own dependency tree — not something app code should rely on staying present).
- A **throwaway** verification: a temporary Zod schema + a temporary component wired with `useForm`/`zodResolver`/`handleSubmit`, used only to prove the pipeline end-to-end, then deleted — the same "build it, verify it fires, delete it" pattern FEAT-001 used to verify the ESLint boundary rule.
- Verification covers two distinct failure modes a version mismatch could hide:
  1. **Type-level wiring** — `useForm<Input>({ resolver: zodResolver(Schema) })` compiles clean under strict TypeScript (a real, previously-seen `@hookform/resolvers`/`zod`/RHF version-triangle incompatibility would surface here as a generic mismatch, not a runtime error).
  2. **Runtime wiring** — the resolver returned by `zodResolver(Schema)` is called directly (matching RHF's own `Resolver` contract) against both an invalid and a valid payload, confirming it returns the correct `errors`/`values` shape RHF expects.
- `npm run lint`/`typecheck`/`build` all pass with the throwaway files removed (i.e., verification artifacts are not left in the shipped tree).

## 3. Explicitly Out of Scope

- **Any real, permanent form component.** No `LoginForm`, `RegisterForm`, etc. — the first real form is `AUTH-001` (Sprint 2), which doesn't exist yet and shouldn't be guessed at.
- **`Input`/`Label`/`FieldError` shared UI primitives** (`ui-guidelines.md` §11.2/§14). These are real, specified components, but building them now — with no real form to size their API against — would be premature; they arrive with the first real form, per the "extract on the third real duplicate, not speculatively" principle (`CLAUDE.md` §7) applied here as "build a form primitive when a form needs it."
- **Browser-driven / user-interaction verification** (typing, blur events, visible error rendering). No Chrome browser-automation connection was available in the prior session either; rather than stand up a whole test framework (Vitest, `@testing-library/react`, jsdom) — a real but larger addition, not part of this ticket's scope — verification is done at the level that actually matters for *this* ticket (the resolver contract and the TypeScript generics), which is where a genuine RHF/Zod version mismatch would actually show up. Full interaction-level form testing (`coding-standards.md` §19) is deferred to whichever ticket sets up Vitest and to each real form's own test.

## 4. Definition of Done

- [x] `react-hook-form`, `zod`, `@hookform/resolvers` installed as direct dependencies.
- [x] Throwaway schema + component built, proving both type-level and runtime `zodResolver` wiring.
- [x] Throwaway verification artifacts deleted after confirming the pipeline works — no example/demo form left in the shipped tree.
- [x] `npm run lint`/`typecheck`/`build` all pass.
- [x] `docs/project-state.md` updated.
