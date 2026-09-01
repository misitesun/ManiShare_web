---
name: learning-web-feature-delivery
description: Implement or modify an English Learning frontend business capability while preserving FSD, responsive behavior, themes and documented contracts. Use for feature work and bug fixes; not for review-only or shared foundation changes.
---

# Learning Web Feature Delivery

## Before implementation

1. Read `AGENTS.md`, development, TypeScript, testing and architecture docs.
2. For a new page or capability, complete `docs/feature-delivery-checklist.md` and stop only on unresolved decisions that materially change scope or architecture.
3. Read the target slice README, public entry, types and tests.
4. If TSX runtime logic, Hooks, state, Effects, lists, client loading or component refactors change, also read `learning-web-react-engineering`.
5. If browser, device, media or Electron behavior is involved, read `docs/compatibility.md` and matching registered contracts.
6. If the task changes routes, theme tokens, storage, environment, dependencies, Tailwind foundation or Electron bridge, also use `learning-web-cross-cutting-change`; it owns the impact map while this Skill continues to own the business delivery checks.

## Delivery

- Place the behavior in the lowest correct FSD layer and import slices only through root entries.
- Keep external data `unknown` until validated; separate DTO, domain and UI types.
- Use literal Tailwind classes and mobile-first `md:` / `xl:` variants. Consume semantic theme utilities only.
- Preserve semantic HTML, visible focus, keyboard access, accessible names and reduced-motion behavior.
- Do not invent course, exercise, progress, audio or AI rules that the requirement has not defined.
- Add tests for parsing, state transitions, formulas, shared behavior and bug regressions; static composition usually needs viewport review instead.
- Update public module README, i18n and affected docs in the same change.

## Verification and handoff

Run `pnpm run test`, `pnpm run lint` and `pnpm run build`. Report changed slices, public contract changes, tested viewports, compatibility impact, assumptions and unverified items.
