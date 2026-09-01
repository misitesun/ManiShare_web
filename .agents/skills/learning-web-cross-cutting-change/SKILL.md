---
name: learning-web-cross-cutting-change
description: Change an English Learning public contract or shared foundation with an explicit impact map and synchronized documentation. Use for routes, Tailwind, themes, storage, environment, dependencies, CI, shared capabilities or Electron bridge changes.
---

# Learning Web Cross-Cutting Change

## Impact map

Before editing, read `AGENTS.md` and all core docs, then list:

- current owner and public entry;
- runtime consumers and FSD direction;
- affected types, i18n keys, storage keys and environment variables;
- Tailwind/theme/responsive consequences;
- Web, H5 and Electron consequences;
- tests, lint, builds and docs that enforce the contract.

If React runtime behavior changes, also read `learning-web-react-engineering`. For browser/device/Electron differences, read `docs/compatibility.md` and registered contracts before changing fallbacks or cleanup.

When a route or shared contract is part of a new business page or capability, also use `learning-web-feature-delivery`. This Skill owns the cross-cutting impact map; the feature Skill continues to own business placement, data-boundary and behavior-test checks.

## Implementation

1. Keep one public owner; do not create compatibility re-exports by default.
2. Update every consumer in the same change and remove obsolete code, dependencies, assets and rules.
3. Tailwind classes stay literal; colors flow through semantic theme tokens; dark and light remain complete.
4. Responsive contracts remain mobile-first and share one renderer across H5, tablet, PC and Electron.
5. Preserve Electron isolation, sandbox, navigation restrictions and narrow preload/IPC APIs.
6. Update module README, global docs, ADR, env examples, i18n and executable checks.
7. Record only confirmed reusable problems as tests, lint, contracts, ADRs or todo items.

## Verification and handoff

Run `pnpm run test`, `pnpm run lint`, `pnpm run build`, and `pnpm run desktop:build` when Electron or shared renderer output changes. Report the impact map, contract before/after, viewport/runtime checks, compatibility impact, assumptions and remaining product decisions.
