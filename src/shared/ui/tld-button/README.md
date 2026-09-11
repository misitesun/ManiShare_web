# TLD Button 按钮

- 职责：提供跨页面的通用文字操作按钮，统一品牌主按钮、表面次按钮、尺寸、整行宽度、交互光标、禁用态和基础响应式表现。
- 入口：从 `src/shared/ui/tld-button` 导入 `TldButton`、`TldButtonProps`、`TldButtonSize` 和 `TldButtonVariant`。
- 约束：默认 `type="button"`；可操作状态固定使用 `cursor-pointer`，原生 `disabled` 状态改为 `cursor-not-allowed`；业务文案、点击状态和图标由调用方传入；不开放 `className` 覆盖公共外观，页面通过外层容器控制位置和宽度。图标按钮、导航页签、开关和链接保留各自语义，不强行套用本组件。
- 响应式：compact 文案使用全局标签字号，regular/large 使用全局卡片标题字号；1920px 保持原设计字号，H5 按语义阶梯缩小但不改变按钮点击高度。
- 扩展：新增视觉 variant 或尺寸前必须有真实消费者，并同步组件测试、所有消费者与本说明；提交中可通过原生 `disabled`、`aria-busy` 等属性表达，不在基础 UI 中持有业务状态。
- 验证：`TldButton.test.ts` 覆盖默认按钮类型和原生属性透传；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 核对主/次按钮、hover、focus 与 disabled；平板和 H5 的视觉及真机兼容由用户验收。
