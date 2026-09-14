---
name: learning-web-feature-delivery
description: Implement or modify an English Learning frontend business capability while preserving FSD, responsive behavior, themes and documented contracts. Use for feature work and bug fixes; not for review-only or shared foundation changes.
---

# Learning Web Feature Delivery

## Before implementation

1. Read `AGENTS.md`, development, TypeScript, testing, architecture and AI collaboration docs.
2. Inspect the worktree, preserve unrelated changes and state the smallest expected file or module boundary before editing.
3. For a new page or capability, complete `docs/feature-delivery-checklist.md` and stop only on unresolved decisions that materially change scope or architecture.
4. Read the target slice README, public entry, types and tests, then search for an existing public capability before creating another one.
5. Classify compatibility impact. If browser, device, media or Electron behavior is involved, read `docs/compatibility.md` and matching registered contracts before choosing an API or changing fallbacks.
6. If TSX runtime logic, Hooks, state, Effects, lists, client loading or component refactors change, also read `learning-web-react-engineering`.
7. If the task changes routes, theme tokens, storage, environment, dependencies, Tailwind foundation or Electron bridge, also use `learning-web-cross-cutting-change`; it owns the impact map while this Skill continues to own the business delivery checks.
8. During investigation and after a fix, decide whether a confirmed, non-obvious problem will change future implementation choices. Route it through `docs/ai-skills.md#从问题到团队知识`; do not turn ordinary debugging history into a rule.

## Delivery

For API integration, data-loading changes or reuse of request-bearing components/Hooks, read `docs/api-capability-boundaries.md`. Check returned fields and implicit requests/preloads/state writes before implementation. Use the documented fallback and feedback path for missing data; add compensating requests only when explicitly required and already authorized. Handoff must include request-source/count evidence and any unverified integration steps.

- Format source, scripts and configuration with four spaces and no tabs. Run `pnpm run format` after edits and treat the root EditorConfig and Prettier configuration as the executable source of truth.
- Default light, single-purpose routes to page colocation: UI, Hooks, state, animation and assets that disappear with the page stay inside `pages/<page>`. Splitting an internal file does not justify a new public slice.
- Extract an independently describable user action or business flow to `features` even with one consumer. Use `widgets` only for a complete large block reused across pages; route small domain-neutral UI to `shared/ui` and stable domain concepts to `entities`.
- Treat a second consumer as a prompt to reassess ownership, not an automatic promotion rule. Do not extract for file length or hypothetical reuse.
- Place the behavior in the lowest correct FSD layer and import slices only through root entries.
- Keep external data `unknown` until validated; separate DTO, domain and UI types.
- Use literal Tailwind classes and mobile-first `md:` / `xl:` variants. Consume semantic theme utilities only. Repeated page, section, card, body, label, tab and action copy uses the responsive typography utilities from `src/app/styles/index.css`; keep exceptional fixed-geometry display text local and bounded.
- For a new or changed App Shell list/management page, read `docs/architecture.md#mainpage-版心与列表适配` before choosing content width and grid columns. Apply its exact PC gutters without legacy page max-widths: compare actual content edges across sibling pages at the same viewport/sidebar state, not padding alone. A Figma column count is not a permanent layout constraint. Preserve existing tablet/H5 gutters; special-layout exceptions require user-confirmed needs documented in the page README.
- Preserve semantic HTML, visible focus, keyboard access, accessible names and reduced-motion behavior.
- Add the literal Tailwind `cursor-pointer` class to every genuinely operable button, link, switch, disclosure, clickable card and icon entry. Do not give disabled or display-only content a pointer cursor; use an explicit disabled cursor when that state needs visual feedback.
- Keep the existing i18n foundation intact, but treat new page and feature copy as Chinese-first during the current product phase. Use direct Chinese text by default; do not add translation keys, placeholder English or mirrored `en-US` copy unless the user explicitly reopens multilingual delivery.
- Do not invent course, exercise, progress, audio or AI rules that the requirement has not defined.
- Preserve registered fallbacks, cleanup and timeout behavior unless the replacement has evidence, documentation and regression coverage.
- Add tests for parsing, state transitions, formulas, shared behavior and bug regressions; static composition usually needs PC viewport review instead. Keep tablet/H5 responsive implementation in scope, but leave their visual and real-device acceptance to the user.
- Update public module README and affected docs in the same change. Update i18n resources only when the request explicitly changes existing translated copy or reopens multilingual delivery; ordinary Chinese-first page work must not be blocked on translation parity.
- Check the relevant idle/loading/success/empty/error states and state explicitly when a product state is deferred.

## Verification and handoff

Run `pnpm run format:check`, `pnpm run test`, `pnpm run lint` and `pnpm run build`; add `pnpm run desktop:build` only when Electron boundaries change. Perform visual acceptance only on PC, using the task/design desktop size or 1440×900 when none is specified. Report changed slices, public contract changes, the PC viewport actually tested, assumptions and unverified product decisions; always mark tablet/H5 visual and real-device compatibility as awaiting user acceptance rather than passed. State `Compatibility impact: none` or list the contracts read, rules preserved or changed, automated evidence and remaining manual verification.
