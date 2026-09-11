# TLD 渐变文字

- 职责：提供可配置颜色、方向、速度、往返与 hover 暂停的动态渐变文字，并可选显示同一动画的渐变边框；不拥有业务文案、点击行为或筛选状态。
- 入口：从 `src/shared/ui/tld-gradient-text` 导入 `TldGradientText`、`TldGradientTextProps` 和 `TldGradientTextDirection`。
- 约束：默认使用当前主题的品牌起止色；`colors` 允许调用方传入至少两种 CSS 颜色字符串，自定义颜色应优先使用主题 CSS 变量。组件基于转录的 React Bits 效果使用原生 CSS 动画，避免新增 `motion` 运行时依赖。`className` 只转发给无样式外层，用于布局，不覆盖组件内部外观；`prefers-reduced-motion` 下不播放动画。
- 扩展：新增视觉参数前需有真实消费者，并同步 Props、就近纯函数测试与本说明；若新增全局 keyframe 或主题 token，同步 `src/app/styles/index.css` 及其 README。
- 验证：`gradient-text-style.test.ts` 覆盖默认色、颜色闭环、方向、速度和循环方向；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 检查动画、hover 暂停、边框与 reduced-motion 静止效果，平板/H5 视觉和真机兼容由用户验收。
