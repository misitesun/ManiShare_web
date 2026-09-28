# Tooltip 文字提示

- 职责：为图标按钮、导航项等触发元素提供 hover/focus 可见的文字提示，并通过 Portal 避免被滚动容器或侧栏裁切。
- 入口：`index.ts` 导出 `Tooltip`、`TooltipGroup`、对应 Props 与 `TooltipPlacement`。普通调用保持单实例 Tooltip；同一交互区域可用 `TooltipGroup` 让多个触发项共用一个 Portal。
- 约束：仅使用 `top` / `right` / `bottom` / `left` 四个具名方向；默认高度 36px、间距 8px，颜色消费专用语义主题 token；保留触发元素原有的 `aria-describedby`，并同时支持鼠标与键盘焦点。Group 在触发项间按真实锚点和内容尺寸移动，根据主轴实时速度产生最多 3° 的轻微倾斜并回正；滚动和 resize 立即校准位置，卸载清理监听、延迟和时间线，reduced-motion 直接到达结果。
- 扩展：使用 `content`、`placement`、`height`、`offset` 和 `fullWidth` 完成内容、方向、尺寸与触发容器适配；只有需要连续暖切换的相邻控件才包裹 `TooltipGroup`，不由业务侧拼接 Tailwind class 或复制动画。
- 验证：`position.test.ts` 覆盖四方向锚点、倾斜方向、速度上限和关闭动画分支；运行 `pnpm run test && pnpm run lint && pnpm run build`，并在 PC 窄轨导航下人工检查 hover/focus、连续切换、快速反向切换、滚动定位与裁切。平板/H5 视觉和真机效果待用户验收。
