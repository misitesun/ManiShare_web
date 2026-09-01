# 应用布局

- 职责：提供 H5 抽屉、平板内容区、PC/Electron 常驻侧栏、顶栏、主题/语言入口和页面 `Outlet`。
- 入口：`index.ts` 导出 `AppLayout`、`AppLayoutProps` 与 `AppNavigationItem`。
- 约束：app 层通过 props 注入导航；widget 不反向导入 `app`。仅保存移动导航开关状态，不承载页面请求或学习业务状态。
- 扩展：新增导航在 `app/config` 完成；跨页面完整展示区块建立独立 widget，页面私有视觉留在 page slice。
- 验证：`pnpm run lint && pnpm run build`；人工检查抽屉 Escape/遮罩关闭、无横向溢出和 390×844、768×1024、1440×900。
