---
name: learning-web-change-review
description: Perform a read-only Learning Web change review for FSD boundaries, public contracts, responsive behavior, themes, accessibility basics, tests and risky assumptions. Use after an implementation diff exists; do not implement fixes.
---

# Learning Web Change Review

## Review process

1. Read `AGENTS.md`, core docs, the relevant implementation Skill and affected module README files.
2. Inspect the full diff or changed files without editing them.
3. Confirm the requested scope before treating a difference as a defect; do not expand the review into an unsolicited redesign.
4. For React runtime changes, apply `learning-web-react-engineering` checks.
5. For browser/device/Electron changes, read `docs/compatibility.md` and matching contracts.
6. Verify FSD direction, root imports, resource ownership, external-data validation, public API synchronization and documentation. Flag page-private components promoted to public slices without an independent business responsibility or real cross-page ownership.
7. Inspect literal Tailwind classes, semantic theme tokens, dark/light completeness, mobile-first breakpoints, overflow, Safe Area, keyboard/focus and reduced motion. Verify every genuinely operable element has an explicit literal `cursor-pointer`, while disabled and display-only content does not misleadingly retain it.
8. Check tests for observable behavior and boundary cases rather than implementation-detail assertions.
9. Check stale quant/finance names, obsolete dependencies/assets, unsafe Electron bridge changes and invented product assumptions.
10. Apply the current Chinese-first copy contract: do not report direct Chinese page text or missing `en-US` parity as a defect unless the reviewed request explicitly includes multilingual delivery. Existing i18n infrastructure and translated resources should remain intact unless their removal is in scope.
11. When the diff fixes a non-obvious problem, verify that confirmed reusable knowledge is routed to lint/test, module docs, compatibility contracts, ADRs or todo instead of remaining only in comments or task history.
12. Run `pnpm run format:check` for the four-space/no-tab contract. Treat its result as the formatting evidence and do not duplicate formatter-owned wrapping or layout preferences as review findings.
13. Run the narrowest useful validation if allowed, but never replace lint/build with visual guesswork.

For changed App Shell list/management layouts, check `docs/architecture.md#mainpage-版心与列表适配`: exact PC gutters must survive the `xl` transition without legacy page max-widths. Compare actual sibling-page content edges at matching viewport/sidebar states, including 1500px, breakpoint edges and a wider PC viewport; checking padding or only one page is insufficient. Respect user-confirmed special-layout exceptions; do not report unchanged unrelated pages as new defects.

## Output

Report only evidence-backed findings caused by the diff, ordered by severity, with path/line evidence, trigger, impact and smallest valid correction. Separate confirmed issues from questions or follow-up suggestions. Review responsive code for H5/tablet/PC, but perform and claim visual acceptance only for the PC viewport; list tablet/H5 visual and real-device compatibility as awaiting user acceptance. If no findings exist, state that and list residual risks or unperformed viewport/runtime checks. Do not claim a command passed unless its output was provided or you ran it. Do not edit files, stage, commit, push or perform external actions in review mode.
