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
| Language key | During the current Chinese-first phase, do not create a key for ordinary new page copy. When multilingual delivery is explicitly reopened, update the requested locale resources, locale-key verification and owning module copy together. |
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

1. Format source, scripts and configuration with four spaces and no tabs. Run `pnpm run format` after edits and treat the root EditorConfig and Prettier configuration as the executable source of truth.
2. Keep one public owner; do not create compatibility re-exports by default.
3. Update every consumer in the same change and remove obsolete code, dependencies, assets and rules.
4. Do not preserve an empty or one-consumer public slice when its implementation is page-private; colocate it with the owner and remove the obsolete entry instead of adding a compatibility re-export.
5. Tailwind classes stay literal; colors flow through semantic theme tokens; dark and light remain complete.
6. Genuinely operable controls, links and clickable surfaces explicitly use the literal Tailwind `cursor-pointer` class; disabled and display-only content does not use a pointer cursor.
7. Responsive contracts remain mobile-first and share one renderer across H5, tablet, PC and Electron. Repeated typography uses the semantic utilities owned by `src/app/styles/index.css`; never introduce root-font, viewport-ratio or full-page scaling.
8. Preserve Electron isolation, sandbox, navigation restrictions and narrow preload/IPC APIs.
9. Update module README, global docs, ADR, env examples and executable checks. Preserve the existing i18n foundation, but update translation resources only when multilingual delivery or existing translated copy is explicitly in scope.
10. Record only confirmed reusable problems as tests, lint, contracts, ADRs or todo items.

## Safety boundaries

- Do not hard-code secrets, product hosts, credentials or pending backend rules to make a change appear complete.
- Dependency install scripts remain denied unless the exact package has been reviewed and recorded in `onlyBuiltDependencies`; never run a bulk `pnpm approve-builds`.
- Do not weaken lint, CI or type rules to complete a migration. Update the contract and implementation instead.
- Do not publish packages, push commits or alter remote settings without explicit user authorization.

## Verification and handoff

Run `pnpm run format:check`, `pnpm run test`, `pnpm run lint` and `pnpm run build`; add `pnpm run desktop:build` when Electron boundaries or desktop build configuration change. Perform visual acceptance only on PC, using the task/design desktop size or 1440×900 when none is specified; keep tablet/H5 compatibility in implementation scope, but mark their visual and real-device acceptance as awaiting the user. Report the impact map, contract before/after, PC viewport/runtime checks, compatibility impact, assumptions and remaining product decisions.
