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

- Format TSX, TypeScript and renderer configuration with four spaces and no tabs. Run `pnpm run format` after edits; do not hand-maintain wrapping that conflicts with the root Prettier configuration.
- Keep components at module scope and split by responsibility, not arbitrary line count.
- Keep extracted page-private components inside the owning page slice. Component extraction improves local readability; it does not by itself justify promotion to `features`, `widgets` or `shared`.
- Use stable domain IDs as list keys and avoid index keys for editable/reorderable collections.
- Pass children or focused props to isolate rerenders before adding memoization.
- Use literal Tailwind class branches; do not construct class names dynamically.
- Share one semantic DOM across mobile/tablet/desktop unless behavior is genuinely different.
- Select responsive typography by semantic role through the utilities owned by `src/app/styles/index.css`. Preserve the H5 readable minimum and 1920px design maximum; do not scale renderer text through the root font size, `vw`, one global ratio or a page transform.
- For App Shell list/management layout, follow `docs/architecture.md#mainpage-版心与列表适配`: let CSS handle content width and adaptive columns without window-width state/Effects. Remove legacy page max-widths and compare sibling pages' actual content edges at the same PC viewport/sidebar state, including 1500px; identical padding alone does not imply identical gutters when auto margins differ. Do not assume class order or a design screenshot's fixed column count is sufficient.

## Async and loading

- Start independent async work together and await near consumption.
- Route-level code splitting is the default useful boundary; justify smaller lazy chunks with bundle evidence.
- Model idle/loading/success/empty/error states explicitly when a real request exists.
- Do not add global state or caching libraries before a measured need.

## Optimization threshold

- Use `memo`, `useMemo` and `useCallback` only for an identified rerender, expensive calculation or required referential identity; they are not default scaffolding.
- For high-frequency input, media or animation, isolate the changing subtree before using deferred or transition-based rendering.
- Establish expected collection size and interaction before choosing pagination, incremental rendering or virtualization; do not add a virtual-list dependency to an ordinary small list.
- Use `React.lazy` and dynamic import for measured or clearly heavy, infrequently reached boundaries. Do not preconfigure Vite manual chunks for theoretical optimization.

## Accessibility and motion

- Interactive elements use native semantics, accessible names, visible focus and keyboard operation.
- Every genuinely operable control or navigation target explicitly includes the literal Tailwind `cursor-pointer` class. Disabled and display-only elements must not retain a pointer cursor; use a disabled cursor variant when appropriate.
- Drawers and menus expose expanded/control state and support Escape where applicable.
- Animation and theme transitions honor reduced-motion and preserve immediate fallbacks.

## Review checklist

Check state ownership, Effect necessity and cleanup, stable identity, async dependency chains, rerender scope, responsive overflow, Tailwind literal detection, theme token use, keyboard/focus behavior, loading boundaries, bundle impact and `pnpm run format:check`. Inspect H5/tablet/PC responsiveness in code, but leave tablet/H5 visual and real-device acceptance to the user and never report it as passed. State which rendering risks were assessed and either the optimization made or the concrete reason it was unnecessary. Run test/lint/build and PC visual acceptance through the owning Skill.
