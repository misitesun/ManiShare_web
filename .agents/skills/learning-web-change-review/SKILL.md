---
name: learning-web-change-review
description: Perform a read-only Learning Web change review for FSD boundaries, public contracts, responsive behavior, themes, accessibility basics, tests and risky assumptions. Use after an implementation diff exists; do not implement fixes.
---

# Learning Web Change Review

## Review process

1. Read `AGENTS.md`, core docs, the relevant implementation Skill and affected module README files.
2. Inspect the full diff or changed files without editing them.
3. For React runtime changes, apply `learning-web-react-engineering` checks.
4. For browser/device/Electron changes, read `docs/compatibility.md` and matching contracts.
5. Verify FSD direction, root imports, external-data validation, public API synchronization and documentation.
6. Inspect literal Tailwind classes, semantic theme tokens, dark/light completeness, mobile-first breakpoints, overflow, Safe Area, keyboard/focus and reduced motion.
7. Check stale quant/finance names, obsolete dependencies/assets, unsafe Electron bridge changes and invented product assumptions.
8. Run the narrowest useful validation if allowed, but never replace lint/build with visual guesswork.

## Output

Report only actionable findings, ordered by severity, with path/line evidence, trigger, impact and smallest valid correction. Separate blockers from improvements. If no findings exist, state that and list residual risks or unperformed viewport/runtime checks. Do not edit files in review mode.
