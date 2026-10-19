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
10. Apply the Chinese-only contract: no language switchers, English loading, saved locale restoration or English parity gates. Existing t() consumers may retain the Chinese compatibility dictionary. Review Chinese copy and initialization; do not report missing English translations as a defect.
11. When the diff fixes a non-obvious problem, verify that confirmed reusable knowledge is routed to lint/test, module docs, compatibility contracts, ADRs or todo instead of remaining only in comments or task history.
12. Apply [开发期间按影响验证](../../../docs/testing-standards.md#0-开发期间按影响验证2026-10-19) and inspect existing valid formatting evidence for the same final code/commit before running anything. For missing level A/B evidence, check only changed source/config files with Prettier/Oxlint; never write files in review mode. Level 0 Markdown-only review checks diff/links and affected documentation contracts without a source build. Do not duplicate formatter-owned wrapping or layout preferences as findings.
13. Run only missing checks required by the selected level and real consumer impact. Local display edits do not require full test/build, mode-exclusive logic requires targeted behavior tests and key interactions, and public API/global token/storage/route/input/shortcut/media/lifecycle changes expand coverage. Verify full test plus one build evidence for public-contract delivery and each small mode's final integration code containing the latest `main`; use test plus desktop:build instead for actual Electron-boundary changes. Build includes lint/type checking and desktop:build includes Web build; reuse valid same-code/commit output instead of repeating nested commands. Source or conflict-resolution changes invalidate affected evidence. Keep CI, behavioral regressions and compatibility assertions intact; visual inspection does not replace applicable automated checks.

For changed App Shell list/management layouts, check `docs/architecture.md#mainpage-版心与列表适配`: exact PC gutters must survive the `xl` transition without legacy page max-widths. Compare actual sibling-page content edges at matching viewport/sidebar states, including 1500px, breakpoint edges and a wider PC viewport; checking padding or only one page is insufficient. Respect user-confirmed special-layout exceptions; do not report unchanged unrelated pages as new defects.

## Output

For API/loading changes or request-bearing component reuse, read `docs/api-capability-boundaries.md`. Check extra detail/per-item/cross-endpoint/preload requests against the task and existing authorization, including implicit state writes. Verify missing-field fallback, backend feedback and request-source/count evidence; do not accept visual success alone as integration evidence. Do not flag explicitly authorized pagination or detail flows merely for using multiple requests.

Report only evidence-backed findings caused by the diff, ordered by severity, with path/line evidence, trigger, impact and smallest valid correction. Separate confirmed issues from questions or follow-up suggestions. Review responsive code for H5/tablet/PC, but perform and claim visual acceptance only for the PC viewport; list tablet/H5 visual and real-device compatibility as awaiting user acceptance. If no findings exist, state that and list residual risks or unperformed viewport/runtime checks. Do not claim a command passed unless its output was provided or you ran it. Do not edit files, stage, commit, push or perform external actions in review mode.

## Next static-export boundary

Use Next App Router as the only framework entry. Business owners stay under src/fsd; src/app is an adapter and must not be imported from FSD. Server adapters pass serializable data; inject callbacks inside FSD app Client assemblies. Keep mixed slice index.ts barrels free of use client and export build-time enumerators through root entries. Client components are prerendered: first render must not read browser storage/viewport or random values. Restore preferences/portals after mount, place useSearchParams under local Suspense, preserve query values with replace and scroll:false. Normalize static asset imports to string URLs inside their owner. Apply [开发期间按影响验证](../../../docs/testing-standards.md#0-开发期间按影响验证2026-10-19) to Next checks. Use `pnpm run typecheck` when Next adapters, generated route types or server/client boundaries need a standalone type-generation check; do not automatically precede a planned build with typecheck because build already includes type checking. Run the documented production runtime smoke or affected scoped suite when route/navigation, hydration-sensitive initialization, RSC, asset/CSP or Electron runtime behavior changes. Pure copy/local-layout edits do not trigger the complete production smoke matrix. File/type checks alone do not prove hydration, RSC, CSP or Electron success. Follow docs/environment.md and docs/static-deployment.md; do not introduce a Next Server or restore obsolete framework commands.

## Design reference fidelity and reflow

Follow docs/decisions/0018-reference-fidelity-and-responsive-reflow.md. At the reference CSS viewport and 100% page zoom, verify actual font size, line height, weight, letter spacing, text-edge gaps and DOM geometry against the design; shared defaults and passing builds are not fidelity evidence. Use explicit semantic density variants when defaults differ, keeping existing consumers unchanged. During development micro-edits, recheck only affected computed properties, geometry and PC states. At small-mode/design delivery, run the applicable complete reference/reflow matrix: verify narrower/wider PC layouts and real browser zoom separately; reducing viewport dimensions is not a real zoom test. H5/tablet visual and real-device acceptance remains with the user. Preserve available-font fallback and never counter-scale user zoom through UA, DPR, root font size or a fixed canvas.
