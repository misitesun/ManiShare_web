# TLD 进度条

- 职责：以统一的数值标准化和无障碍进度语义展示有限区间的线性或圆形进度。
- 入口：`index.ts` 导出 `TldProgressBar`、`TldCircularProgress`、各自 Props、线性进度条尺寸、标准化函数及结果类型。
- 约束：`value` 会限制在 `0..max`；非有限值、零或负数上限按空进度处理。线性进度默认展示 `value/max`，已有独立业务摘要时可通过 `showValue={false}` 只保留带完整无障碍数值的轨道；颜色只消费语义主题 token，动态内联样式只表达进度宽度；线性进度文案使用全局 label 语义字号，圆形进度因固定几何保留专用微型字号。
- 扩展：线性与圆形几何保持为同一能力下的两个具名组件并复用 `normalizeProgress`；需要新的文案、尺寸或色调变体时先扩展具名 Props，不允许由业务侧拼接 Tailwind class。
- 验证：`progress.test.ts` 覆盖正常、越界和非法数值；运行 `pnpm run test && pnpm run lint && pnpm run build`。
