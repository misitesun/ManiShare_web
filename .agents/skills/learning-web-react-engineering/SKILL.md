---
name: learning-web-react-engineering
description: Design, implement or review Learning Web React rendering code with deliberate state, effect, list, async, responsive and bundle choices. Use for TSX, Hooks, client loading, media or component refactors; not for pure copy or non-renderer configuration.
---

# Learning Web React Engineering

Use alongside the feature or cross-cutting Skill; it does not own business scope.

## State and Effects

- Store the smallest source of truth; derive render-only values during render.
- Keep transient interaction state local unless distant consumers need it.
- Use Effects only to synchronize with external systems. Clean up listeners, timers, subscriptions and pending work.
- Avoid unconditional state writes inside Effects and dependency suppression.
- Functional updates are required when next state depends on previous state.

## Rendering and lists

- Keep components at module scope and split by responsibility, not arbitrary line count.
- Use stable domain IDs as list keys and avoid index keys for editable/reorderable collections.
- Pass children or focused props to isolate rerenders before adding memoization.
- Use literal Tailwind class branches; do not construct class names dynamically.
- Share one semantic DOM across mobile/tablet/desktop unless behavior is genuinely different.

## Async and loading

- Start independent async work together and await near consumption.
- Route-level code splitting is the default useful boundary; justify smaller lazy chunks with bundle evidence.
- Model idle/loading/success/empty/error states explicitly when a real request exists.
- Do not add global state or caching libraries before a measured need.

## Accessibility and motion

- Interactive elements use native semantics, accessible names, visible focus and keyboard operation.
- Drawers and menus expose expanded/control state and support Escape where applicable.
- Animation and theme transitions honor reduced-motion and preserve immediate fallbacks.

## Review checklist

Check state ownership, Effect necessity and cleanup, stable identity, rerender scope, responsive overflow, Tailwind literal detection, theme token use, keyboard/focus behavior, loading boundaries and bundle impact. Run test/lint/build through the owning Skill.
