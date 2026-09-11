# TLD Dialog 对话框

- 职责：提供跨页面的受控对话框外壳，统一 Portal、渐变边框、遮罩、标题、内容插槽、基于 `TldButton` 的居中操作区和基础键盘/焦点行为。
- 入口：从 `src/shared/ui/tld-dialog` 导入 `TldDialog`、`TldDialogProps` 和 `TldDialogSize`。
- 约束：由调用方通过 `open` / `onOpenChange` 持有展开状态；`title` 必填以保证可访问名称；`children` 是 React 自定义内容插槽并优先于 `content`；默认中文按钮为用户确认的当前阶段文案，业务可传入明确文案覆盖；操作按钮统一复用 `TldButton`，弹窗不复制按钮视觉。同一时刻只打开一个 `TldDialog`，不在基础 UI 中预建全局弹窗队列或业务状态。
- 交互：默认展示右上角关闭按钮与“取消/确认”按钮，取消总是关闭，确认默认关闭；异步提交可设置 `closeOnConfirm={false}` 并由调用方根据结果关闭，提交期间通过 `confirmDisabled` 防止重复操作。Escape 和遮罩关闭可分别禁用；打开时限制焦点、锁定页面滚动，关闭后恢复原焦点。
- 响应式：`small` / `medium` / `large` 的最大宽度分别为 420 / 560 / 742px，默认 `large`；H5 保留 12px 安全边距且操作按钮纵向排列，平板与 PC 按钮在底部居中，超高内容仅在对话框内滚动。正文消费全局 body 语义字号，标题保留 Dialog 已确认的 20/22px 规格。
- 扩展：用 `showCancelButton` / `showConfirmButton` 独立控制操作项，业务表单、上传、校验和提交错误继续由所属 page/feature 通过插槽实现，不下沉到对话框。
- 验证：`dialog-behavior.test.ts` 覆盖 Escape/遮罩的独立关闭策略；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 端按 Figma 1920×1080 核对 742px 宽度、渐变边框、右上角关闭和底部居中按钮；768×1024 平板与 390×844 H5 的视觉和真机兼容由用户验收。
