---
name: learning-web-cross-cutting-change
description: Change an English Learning public contract or shared foundation with an explicit impact map and synchronized documentation. Use for routes, Tailwind, themes, storage, environment, dependencies, CI, shared capabilities or Electron bridge changes.
---

# Learning Web Cross-Cutting Change

Use this Skill when a change affects more than its immediate implementation module. The goal is one coherent public contract, not a local patch that leaves configuration, documentation or validation out of sync.

## Impact map

For every design-driven implementation, apply [编码前方案](../../../docs/ai-collaboration.md#设计稿驱动任务的编码前方案) before editing code. Merge this impact map into the user-visible five-part plan rather than replacing or duplicating it. Base the plan on verified repository owners and public contracts, cover layout, interactions/state, reused/new components with reasons, PC/tablet/H5 adaptation, and ordered implementation/verification. Explicitly request confirmation and stop implementation changes until the user confirms. A confirmed plan remains valid only for its stated scope; a new design node or material scope/contract change requires an updated plan and renewed confirmation.

Before editing, read `AGENTS.md`, every core document it requires, `docs/ai-collaboration.md` and the affected public entries, then list:

- current owner and public entry;
- runtime consumers and FSD direction;
- affected types, i18n keys, storage keys and environment variables;
- Tailwind/theme/responsive consequences;
- Web, H5 and Electron consequences;
- tests, lint, builds and docs that enforce the contract.

If React runtime behavior changes, also read `learning-web-react-engineering`. For browser/device/Electron differences, read `docs/compatibility.md` and registered contracts before changing fallbacks or cleanup.

Create or update an ADR when the change establishes a long-lived cross-module direction. Do not create an ADR for a reversible internal detail. Route confirmed, non-obvious reusable problems through `docs/ai-skills.md#从问题到团队知识` and include their enforcement evidence in the impact map.

When a route or shared contract is part of a new business page or capability, also use `learning-web-feature-delivery`. This Skill owns the cross-cutting impact map; the feature Skill continues to own business placement, data-boundary and behavior-test checks.

## Contract checklist

Apply only the rows relevant to the requested change:

| Change | Also inspect or update |
| --- | --- |
| Route | route constants, router, page slice, navigation and locale copy when applicable, and route documentation |
| Shared capability | named capability directory, public `index.ts`, focused tests, module README and `docs/module-capabilities.md` |
| API/loading or request-bearing shared component | `docs/api-capability-boundaries.md`, consumer request triggers/counts, implicit preloads/state writes, missing-field feedback and explicit requirements/authorization for compensating requests |
| Copy and locale | UI and development are Chinese-only. Keep zh-CN initialization deterministic and ignore legacy English preferences. New copy is direct Chinese; do not add i18n keys, language switchers, English loading, translations or parity gates. |
| Storage key | `sharedConfig.storageKeys`, `StorageSchema`, storage behavior, tests and documentation |
| Theme/token | theme registration, complete semantic tokens, current Chinese label, PC visual acceptance and tablet/H5 user-acceptance handoff; add other locale labels only when multilingual delivery is explicitly in scope |
| Tailwind/responsive | global style entry, literal class detection, mobile-first breakpoints, semantic typography roles, overflow/Safe Area behavior, PC viewport checks and explicit tablet/H5 user-acceptance handoff |
| Main-page content width/grid | `docs/architecture.md#mainpage-版心与列表适配`, exact 16px gutters at 1280–1919px and 250px at/above 1920px, no legacy page max-widths, cross-page content-edge comparisons at matching viewport/sidebar states; do not globally retrofit unrelated special-layout pages |
| Environment/build | environment templates, type/config validation, environment docs, CI and deployment assumptions |
| Dependency | reuse decision, `package.json`, `pnpm-lock.yaml`, build-script allowlist, purpose/risk documentation and CI |
| Electron bridge | preload contract, validated main-process IPC handler, renderer abstraction when consumed, Electron README and desktop build |
| Compatibility contract | compatibility index, owning capability, observable fallback/cleanup test and required manual runtime verification |
| Public module boundary | owning README with responsibility, entry, constraints, extension points and verification |
| Slice promotion/removal | actual consumers, page-private ownership, replacement imports, obsolete root entry/README/assets and architecture decision |

## Implementation

1. Format source, scripts and configuration with four spaces and no tabs. Use `pnpm exec prettier --write <files>` for this change's files; run whole-repository `pnpm run format` only when an explicit repository-wide formatting change requires it. Treat the root EditorConfig and Prettier configuration as the executable source of truth.
2. Keep one public owner; do not create compatibility re-exports by default.
3. Update every consumer in the same change and remove obsolete code, dependencies, assets and rules.
4. Do not preserve an empty or one-consumer public slice when its implementation is page-private; colocate it with the owner and remove the obsolete entry instead of adding a compatibility re-export.
5. Tailwind classes stay literal; colors flow through semantic theme tokens; dark and light remain complete.
6. Genuinely operable controls, links and clickable surfaces explicitly use the literal Tailwind `cursor-pointer` class; disabled and display-only content does not use a pointer cursor.
7. Responsive contracts remain mobile-first and share one renderer across H5, tablet, PC and Electron. Repeated typography uses the semantic utilities owned by `src/fsd/app/styles/index.css`; never introduce root-font, viewport-ratio or full-page scaling.
8. Preserve Electron isolation, sandbox, navigation restrictions and narrow preload/IPC APIs.
9. Update module README, global docs, ADR, env examples and executable checks. Existing i18n serves only the Chinese compatibility dictionary; do not maintain historical English resources or require language synchronization.
10. Record only confirmed reusable problems as tests, lint, contracts, ADRs or todo items.

## Safety boundaries

- Do not hard-code secrets, product hosts, credentials or pending backend rules to make a change appear complete.
- Dependency install scripts remain denied unless the exact package has been reviewed and recorded in `onlyBuiltDependencies`; never run a bulk `pnpm approve-builds`.
- Do not weaken lint, CI or type rules to complete a migration. Update the contract and implementation instead.
- Do not publish packages, push commits or alter remote settings without explicit user authorization.

## Verification and handoff

Select checks through [开发期间按影响验证](../../../docs/testing-standards.md#0-开发期间按影响验证2026-10-19), the authoritative level 0/A/B/C policy. A documentation-only contract clarification stays level 0: inspect diff/links and relevant documentation contracts without building source. Local display-only edits use changed-file formatting/Oxlint and affected PC states; mode-exclusive logic uses targeted behavior tests and key interactions. Public API, global tokens, storage, routing, input/shortcuts, media and lifecycle changes require level C coverage expanded through actual consumers. Keep required observable behavior tests, fallbacks and compatibility assertions.

Before handing off a public contract, and for each completed small mode's final integration code containing the latest `main`, run full `pnpm run test` and one `pnpm run build`. If Electron boundaries or desktop build configuration are affected, use test plus `pnpm run desktop:build` instead. Build includes lint and type checking; desktop build includes the Web build. Reuse valid same-code/commit output and rerun affected checks after source or conflict-resolution changes. Do not repeat the nested commands or all unrelated runtime suites; CI requirements remain unchanged.

Perform visual acceptance only on PC, using the task/design desktop size or 1440×900 when none is specified. Recheck affected properties/states during development micro-edits, and retain the applicable complete design-baseline/reflow matrix at public-contract or small-mode/design delivery. Keep tablet/H5 compatibility in implementation scope, but mark their visual and real-device acceptance as awaiting the user. Report the impact map, contract before/after, selected level, executed/reused/deferred checks, PC viewport/runtime checks, compatibility impact, assumptions and remaining product decisions.

## Next static-export boundary

Use Next App Router as the only framework entry. Business owners stay under src/fsd; src/app is an adapter and must not be imported from FSD. Server adapters pass serializable data; inject callbacks inside FSD app Client assemblies. Keep mixed slice index.ts barrels free of use client and export build-time enumerators through root entries. Client components are prerendered: first render must not read browser storage/viewport or random values. Restore preferences/portals after mount, place useSearchParams under local Suspense, preserve query values with replace and scroll:false. Normalize static asset imports to string URLs inside their owner. Apply [开发期间按影响验证](../../../docs/testing-standards.md#0-开发期间按影响验证2026-10-19) to Next checks. Use `pnpm run typecheck` when Next adapters, generated route types or server/client boundaries need a standalone type-generation check; do not automatically precede a planned build with typecheck because build already includes type checking. Run the documented production runtime smoke or affected scoped suite when route/navigation, hydration-sensitive initialization, RSC, asset/CSP or Electron runtime behavior changes. Pure copy/local-layout edits do not trigger the complete production smoke matrix. File/type checks alone do not prove hydration, RSC, CSP or Electron success. Follow docs/environment.md and docs/static-deployment.md; do not introduce a Next Server or restore obsolete framework commands.

## Design reference fidelity and reflow

Follow docs/decisions/0018-reference-fidelity-and-responsive-reflow.md. At the reference CSS viewport and 100% page zoom, verify actual font size, line height, weight, letter spacing, text-edge gaps and DOM geometry against the design; shared defaults and passing builds are not fidelity evidence. Use explicit semantic density variants when defaults differ, keeping existing consumers unchanged. During development micro-edits, recheck only affected computed properties, geometry and PC states. At small-mode/design delivery, run the applicable complete reference/reflow matrix: verify narrower/wider PC layouts and real browser zoom separately; reducing viewport dimensions is not a real zoom test. H5/tablet visual and real-device acceptance remains with the user. Preserve available-font fallback and never counter-scale user zoom through UA, DPR, root font size or a fixed canvas.
