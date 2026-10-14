# TLD 进度条

比例进度条可用`spacing="wide"`将数值/轨道间距设为13px，默认standard仍为10px；查漏补缺用于还原设计位置，进度归一化、可访问范围与轨道尺寸保持既有语义。浏览器计算样式负责视觉数值验收，同目录TldProgressBar.test.ts覆盖变体下的归一化与名称/范围。

- 职责：以统一的数值标准化和无障碍进度语义展示有限区间的线性或圆形进度。
- 入口：`index.ts` 导出 `TldProgressBar`、`TldCircularProgress`、各自 Props、线性进度条尺寸、标准化函数及结果类型。
- 约束：`value` 会限制在 `0..max`；非有限值、零或负数上限按空进度处理。线性进度默认展示 `value/max`，已有独立业务摘要时可通过 `showValue={false}` 只保留带完整无障碍数值的轨道；颜色只消费语义主题 token，动态内联样式只表达进度宽度；线性进度文案使用全局 label 语义字号，圆形进度因固定几何保留专用微型字号。
- 扩展：线性与圆形几何保持为同一能力下的两个具名组件并复用 `normalizeProgress`；需要新的文案、尺寸或色调变体时先扩展具名 Props，不允许由业务侧拼接 Tailwind class。
- 验证：`progress.test.ts` 覆盖正常、越界和非法数值；运行 `pnpm run test && pnpm run lint && pnpm run build`。

- challenge轨道26px、百分比文字18/25、间距14px；valueFormat=percentage显示归一化百分比并保持ARIA/填充一致，默认fraction及原尺寸不变。PK加载72%演示经用户确认，不发请求或自动推进。
