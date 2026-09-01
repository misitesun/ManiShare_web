# 主题

- 职责：应用、持久化和切换注册主题，并提供主题 Context 与过渡能力。
- 入口：`index.ts` 导出 `ThemeProvider`、主题 Hook、初始化和过渡能力。
- 约束：主题名只在 config 注册；组件不得直接写主题判断、根节点属性或 View Transition 调用。原生 `startViewTransition` 必须保留 `document` receiver，详见主题切换兼容性契约。
- 扩展：新增主题时同步 `shared/config/theme.ts`、`app/styles/index.css` 的全部语义 token、两种语言名称和三个基础视口验证。
- 验证：`pnpm run lint && pnpm run build`；改变持久化或切换状态时补就近测试，并在支持/不支持 View Transition 与 reduced-motion 环境复测。
