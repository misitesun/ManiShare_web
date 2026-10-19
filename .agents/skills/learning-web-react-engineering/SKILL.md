---
name: learning-web-react-engineering
description: Design, implement or review Learning Web React rendering code with deliberate state, effect, list, async, responsive and bundle choices. Use for TSX, Hooks, client loading, media or component refactors; not for pure copy or non-renderer configuration.
---

# Learning Web React Engineering

Use alongside the feature or cross-cutting Skill; it does not own business scope.

## Assess the rendering path first

Before changing renderer code, identify only the factors that apply:

- which interaction, request or external subscription triggers the update;
- whether rendered data can be large, frequently refreshed or media-heavy;
- whether derived values duplicate source state;
- whether independent client work is accidentally serialized; and
- whether a rarely used, genuinely heavy dependency belongs behind a route or component boundary.

Read the owning public entry, nearby components, Hooks, tests and README. Move state no higher than its real consumers and preserve FSD ownership.

## State and Effects

- Store the smallest source of truth; derive render-only values during render.
- Keep transient interaction state local unless distant consumers need it.
- Use Effects only to synchronize with external systems. Clean up listeners, timers, subscriptions and pending work.
- Avoid unconditional state writes inside Effects and dependency suppression.
- Functional updates are required when next state depends on previous state.

## Rendering and lists

- Format TSX, TypeScript and renderer configuration with four spaces and no tabs. Use `pnpm exec prettier --write <files>` for this change's files; reserve whole-repository `pnpm run format` for an explicit repository-wide formatting need. Do not hand-maintain wrapping that conflicts with the root Prettier configuration.
- Keep components at module scope and split by responsibility, not arbitrary line count.
- Keep extracted page-private components inside the owning page slice. Component extraction improves local readability; it does not by itself justify promotion to `features`, `widgets` or `shared`.
- Use stable domain IDs as list keys and avoid index keys for editable/reorderable collections.
- Pass children or focused props to isolate rerenders before adding memoization.
- Use literal Tailwind class branches; do not construct class names dynamically.
- Share one semantic DOM across mobile/tablet/desktop unless behavior is genuinely different.
- Select responsive typography by semantic role through the utilities owned by `src/fsd/app/styles/index.css`. Preserve the H5 readable minimum and 1920px design maximum; do not scale renderer text through the root font size, `vw`, one global ratio or a page transform.
- For App Shell list/management layout, follow `docs/architecture.md#mainpage-版心与列表适配`: let CSS handle content width and adaptive columns without window-width state/Effects. Remove legacy page max-widths and compare sibling pages' actual content edges at the same PC viewport/sidebar state, including 1500px; identical padding alone does not imply identical gutters when auto margins differ. Do not assume class order or a design screenshot's fixed column count is sufficient.

## Async and loading

- For API/loading changes and request-bearing component reuse, read `docs/api-capability-boundaries.md` and trace implicit requests, preloads and state writes. Do not fill missing response fields with extra requests without explicit requirements and authorization.
- Start independent, in-scope async work together and await near consumption; concurrency or preloading optimizations do not authorize new data-completion requests. Verify request sources/counts as well as rendered output.
- Route-level code splitting is the default useful boundary; justify smaller lazy chunks with bundle evidence.
- Model idle/loading/success/empty/error states explicitly when a real request exists.
- Do not add global state or caching libraries before a measured need.

## Optimization threshold

- Use `memo`, `useMemo` and `useCallback` only for an identified rerender, expensive calculation or required referential identity; they are not default scaffolding.
- For high-frequency input, media or animation, isolate the changing subtree before using deferred or transition-based rendering.
- Establish expected collection size and interaction before choosing pagination, incremental rendering or virtualization; do not add a virtual-list dependency to an ordinary small list.
- Use `React.lazy` and dynamic import for measured or clearly heavy, infrequently reached boundaries. Use Next route splitting first; do not preconfigure manual chunks for theoretical optimization.

## Accessibility and motion

- Interactive elements use native semantics, accessible names, visible focus and keyboard operation.
- Every genuinely operable control or navigation target explicitly includes the literal Tailwind `cursor-pointer` class. Disabled and display-only elements must not retain a pointer cursor; use a disabled cursor variant when appropriate.
- Drawers and menus expose expanded/control state and support Escape where applicable.
- Animation and theme transitions honor reduced-motion and preserve immediate fallbacks.

## Review checklist

Check applicable state ownership, Effect necessity and cleanup, stable identity, async dependency chains, rerender scope, responsive overflow, Tailwind literal detection, theme token use, keyboard/focus behavior, loading boundaries and bundle impact. Select formatting and runtime checks through [开发期间按影响验证](../../../docs/testing-standards.md#0-开发期间按影响验证2026-10-19), not a fixed full-suite sequence. Local display micro-edits need changed-file formatting/Oxlint and affected PC states; mode-exclusive state/Hook changes need targeted behavior tests and key interactions. Public APIs, global tokens, storage, routing, input/shortcuts, media and lifecycle changes expand coverage through actual consumers. Preserve behavior, cleanup, fallback and regression tests rather than substituting visual inspection for them.

Use the owning Skill for public-contract delivery and completed small-mode integration gates: full test plus one build on final code containing the latest `main`; use test plus desktop:build instead when Electron boundaries are affected. Build includes lint/type checking and desktop:build includes the Web build, so reuse valid same-code/commit output and avoid nested duplicates. Source or conflict-resolution changes invalidate affected evidence. Documentation-only work needs no renderer build; CI stays unchanged. Inspect H5/tablet/PC responsiveness in code, but leave tablet/H5 visual and real-device acceptance to the user and never report it as passed. State assessed rendering risks, the optimization made or why it was unnecessary, and executed/reused/deferred checks.

## Next static-export boundary

Use Next App Router as the only framework entry. Business owners stay under src/fsd; src/app is an adapter and must not be imported from FSD. Server adapters pass serializable data; inject callbacks inside FSD app Client assemblies. Keep mixed slice index.ts barrels free of use client and export build-time enumerators through root entries. Client components are prerendered: first render must not read browser storage/viewport or random values. Restore preferences/portals after mount, place useSearchParams under local Suspense, preserve query values with replace and scroll:false. Normalize static asset imports to string URLs inside their owner. Apply [开发期间按影响验证](../../../docs/testing-standards.md#0-开发期间按影响验证2026-10-19) to Next checks. Use `pnpm run typecheck` when Next adapters, generated route types or server/client boundaries need a standalone type-generation check; do not automatically precede a planned build with typecheck because build already includes type checking. Run the documented production runtime smoke or affected scoped suite when route/navigation, hydration-sensitive initialization, RSC, asset/CSP or Electron runtime behavior changes. Pure copy/local-layout edits do not trigger the complete production smoke matrix. File/type checks alone do not prove hydration, RSC, CSP or Electron success. Follow docs/environment.md and docs/static-deployment.md; do not introduce a Next Server or restore obsolete framework commands.

## Design reference fidelity and reflow

Follow docs/decisions/0018-reference-fidelity-and-responsive-reflow.md. At the reference CSS viewport and 100% page zoom, verify actual font size, line height, weight, letter spacing, text-edge gaps and DOM geometry against the design; shared defaults and passing builds are not fidelity evidence. Use explicit semantic density variants when defaults differ, keeping existing consumers unchanged. During development micro-edits, recheck only affected computed properties, geometry and PC states. At small-mode/design delivery, run the applicable complete reference/reflow matrix: verify narrower/wider PC layouts and real browser zoom separately; reducing viewport dimensions is not a real zoom test. H5/tablet visual and real-device acceptance remains with the user. Preserve available-font fallback and never counter-scale user zoom through UA, DPR, root font size or a fixed canvas.

## Chinese-only renderer

Keep first render and hydration in zh-CN. Do not restore historical English preferences, add language switching or require translations. New UI copy is direct Chinese; existing t() calls consume only the Chinese compatibility dictionary.
