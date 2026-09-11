# Tooltip 文字提示

- 职责：为图标按钮、导航项等触发元素提供 hover/focus 可见的文字提示，并通过 Portal 避免被滚动容器或侧栏裁切。
- 入口：`index.ts` 导出 `Tooltip`、`TooltipProps` 与 `TooltipPlacement`。
- 约束：仅使用 `top` / `right` / `bottom` / `left` 四个具名方向；默认高度 36px、间距 8px，颜色消费专用语义主题 token；保留触发元素原有的 `aria-describedby`，并同时支持鼠标与键盘焦点。
- 扩展：使用 `content`、`placement`、`height`、`offset` 和 `fullWidth` 完成内容、方向、尺寸与触发容器适配；不由业务侧拼接 Tailwind class。
- 验证：`position.test.ts` 覆盖四方向锚点计算；运行 `pnpm run test && pnpm run lint && pnpm run build`，并在 PC 窄轨导航下人工检查 hover/focus 与裁切。
