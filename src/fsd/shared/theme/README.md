# 主题

- 职责：应用、持久化和切换注册主题，并提供主题 Context 与过渡能力。
- 入口：`index.ts` 导出 `ThemeProvider`、主题 Hook、初始化和过渡能力，以及供 Next root layout 使用的 `getThemeBootstrapScript`。
- 约束：主题名只在 config 注册；组件不得直接写主题判断、根节点属性或 View Transition 调用。原生 `startViewTransition` 必须保留 `document` receiver，详见主题切换兼容性契约。
- 扩展：新增主题时同步 `shared/config/theme.ts`、`src/fsd/app/styles/index.css` 的全部语义 token 和中文名称；其他语言待翻译工作重新开启。Codex 只做 PC 视觉验收，H5/平板主题视觉由用户验收。
- 验证：`pnpm run lint && pnpm run build`；改变持久化或切换状态时补就近测试，并在支持/不支持 View Transition 与 reduced-motion 环境复测。

首次 React 渲染使用确定的 dark 值，挂载后恢复持久化偏好。pre-hydration bootstrap 仅接受注册主题，并容忍未知值与 Storage 禁用；通过 storage owner 生成读取表达式，作为逐 HTML CSP hash 的一部分交付。`bootstrap.test.ts` 与生产 runtime:smoke 分别验证数据边界和实际恢复/水合。
