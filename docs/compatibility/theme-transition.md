# 主题切换兼容性契约

- 适用范围与触发关键词：`shared/theme`、主题切换、View Transition、`document.startViewTransition`、reduced motion。
- 已验证环境与现象：2026-09-01 在本地 Chromium renderer 复现；将 `document.startViewTransition` 赋给普通变量后直接调用，会因丢失 `document` receiver 抛出 `TypeError: Illegal invocation`，主题状态不更新。
- 必须保留的实现/降级/清理规则：调用前用 `.bind(document)` 保留 receiver，或始终以 `document.startViewTransition(...)` 形式调用；不支持该 API、禁用动画或用户偏好 reduced motion 时立即更新主题。
- 不应采用的简化方式及原因：不得提取未绑定的方法再调用；它通过 TypeScript、lint 和生产构建，但会在支持 View Transition 的浏览器运行失败。
- 唯一公共代码入口：`src/shared/theme/lib/useThemeTransition.ts`，组件只调用 `useThemeTransition`。
- 自动化验证：当前 Node 测试环境没有 DOM/View Transition；`pnpm run lint && pnpm run build` 仅验证静态边界，不能替代浏览器复测。
- 人工复测环境与步骤：在支持 View Transition 的 Chromium 选择 dark/light，确认 `data-theme` 与页面颜色变化且控制台无错误；再在 reduced-motion 或无 API 环境确认直接切换。
- 替换或删除该规则的证据与关闭条件：只有公共入口不再使用原生 View Transition，或新的实现已在支持/不支持 API 与 reduced-motion 环境验证后，才能更新或删除本契约。
