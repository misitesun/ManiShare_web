# TLD Dialog 对话框

- 职责：提供跨页面的受控对话框外壳，统一 Portal、渐变边框、带 2px 背景模糊的遮罩、标题、内容插槽、基于 `TldButton` 的居中操作区和基础键盘/焦点行为。
- 入口：从 `src/fsd/shared/ui/tld-dialog` 导入 `TldDialog`、`TldDialogProps` 和 `TldDialogSize`。
- 约束：由调用方通过 `open` / `onOpenChange` 持有展开状态；`title` 必填以保证可访问名称，无可视标题的设计传 `showHeader={false}` 时仍保留读屏标题；`children` 是 React 自定义内容插槽并优先于 `content`；默认中文按钮为用户确认的当前阶段文案，业务可传入明确文案覆盖；操作按钮统一复用 `TldButton`，弹窗不复制按钮视觉。同一时刻只打开一个 `TldDialog`，不在基础 UI 中预建全局弹窗队列或业务状态。
- 交互：默认展示右上角关闭按钮与“取消/确认”按钮，取消总是关闭，确认默认关闭；异步提交可设置 `closeOnConfirm={false}` 并由调用方根据结果关闭，提交期间通过 `confirmDisabled` 防止重复操作。Escape 和遮罩关闭可分别禁用；打开时限制焦点、锁定页面滚动，关闭后恢复原焦点。首次焦点在弹窗 frame 时，Tab/Shift+Tab 显式进入首/末控件；意外外部焦点和仅一个控件也保持双向循环。
- 响应式：`small` / `medium` / `large` 的最大宽度分别为 420 / 576 / 742px，新增 `extra-large` 为802px，默认 `large`；H5 保留 12px 安全边距，高度随内容自适应，不继承桌面的最小高度；取消/确认按钮始终同排等宽，间距 12px，单按钮占满操作区。平板与 PC 保留 220/280/320px 最小高度及底部居中 180px 按钮，超高内容仅在对话框内滚动。正文消费全局 body 语义字号，标题保留 Dialog 已确认的 20/22px 规格；隐藏标题时关闭图标缩为 24px，但保留 40px 点击区。
- 扩展：`titleAlignment="center"` 使用对称标题内边距居中标题；`footer` 自定义底部插槽优先于默认操作项，业务负责其中按钮及校验，仍在滚动正文之外并参与焦点限制；传 null 可明确隐藏底部内容。用 `showCancelButton` / `showConfirmButton` 独立控制操作项，用 `showHeader` 控制可视标题区；业务表单、上传、校验和提交错误继续由所属 page/feature 通过插槽实现，不下沉到对话框。
- 验证：`dialog-behavior.test.ts` 覆盖 Escape/遮罩的独立关闭策略及首次/首尾/单项/无控件的双向焦点转换；TldDialog.test.ts 覆盖宽弹窗、自定义底部的预渲染 Portal 延迟；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 端按 Figma 1920×1080 核对 742px 宽度、渐变边框、右上角关闭和底部居中按钮；768×1024 平板与 390×844 H5 的视觉和真机兼容由用户验收。

density=compact为真实紧凑提示消费者提供无正文外层padding、20/28标题及分隔线；headerSpacing=tight对应13px上/横间距，standard紧凑为15px，既有standard密度默认不变。fit-medium/fit-wide最大宽470/563px，内容适高，无桌面min-height。showCloseButton默认true，可与closeOnEscape/closeOnBackdrop=false及隐藏取消操作组合实现不可关闭签到；业务状态仍归owner。Portal挂载后、焦点限制、滚动锁定和清理继续共享；runtime覆盖单按钮Tab循环与全部禁止关闭路径。

紧凑关闭图标使用Figma2130:21630原始20×20 SVG，默认图标仍保留。内容适高窗使用五层径向渐变边框dialog-border。

titleTone=soft用于俱乐部标题dark#D9D9D9，light映射primary，默认标题不变；紧凑关闭图标由headerSpacing定位到原稿槽位（tight x432/y18，standard x434/y20，470px基准）。
