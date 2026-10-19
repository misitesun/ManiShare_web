# TLD Dialog 对话框

- 局部动画：根入口额外提供`TldDialogMotionProvider`及只读`useTldDialogMotionEnabled`，在指定React业务树内启用240ms的遮罩淡入/淡出及内容12px轻位移、0.97→1缩放；嵌套Portal继承同一配置。当前只在练习页装配，其他页面默认即时显隐。原稿referenceFrame偏移继续由独立内框承担，动画只作用于新增外层，不覆盖设计坐标或缩放整页。
- 退场：调用方持续挂载`TldDialog`并将open设false，外壳保留最后一次展开的标题/内容直至动画完成，关闭画面立即inert/aria-hidden且不接收指针；逻辑关闭仍沿原时机释放焦点/滚动隔离。快速重开从当前进度反向，每轮独立GSAP context取消旧回调并释放引用。系统reduced-motion即时到达最终状态，运行中切换也结束当前动画。可选`onAfterClose`仅在真实打开后的关闭完成时调用，适用于退场后开始新模式/返回目录；首次关闭态与预渲染不调用，重新打开取消旧完成动作。外层直接条件卸载会跳过退场，应由owner保持组件存活；确认/取消的业务状态仍由调用方负责。

- `fit-extra-wide`为课程/练习模式选择提供默认819px最大宽、内容适高和sRGB表面渐变，业务内容通过compact/no-header插槽布局。可选`referenceFrame`（根入口同时导出`TldDialogReferenceFrame`）只用于此尺寸：宽度控制最大宽，偏移仅在design阈值校正原稿坐标，不缩放页面或弹窗。低高度时垂直偏移限制在上下24px安全边界，超高内容在内部滚动；默认宽度和半像素修正保持。`surface="solid"`供纯色原稿显式消费，两主题均使用语义表面；默认仍为渐变。自定义关闭按钮继续配合公共Esc、遮罩、焦点和滚动隔离。

- 职责：提供跨页面的受控对话框外壳，统一 Portal、渐变边框、带 2px 背景模糊的遮罩、标题、内容插槽、基于 `TldButton` 的居中操作区和基础键盘/焦点行为。
- 入口：从 `src/fsd/shared/ui/tld-dialog` 导入 `TldDialog`、`TldDialogProps` 和 `TldDialogSize`。
- 约束：由调用方通过 `open` / `onOpenChange` 持有展开状态；`title` 必填以保证可访问名称，无可视标题的设计传 `showHeader={false}` 时仍保留读屏标题；`children` 是 React 自定义内容插槽并优先于 `content`；默认中文按钮为用户确认的当前阶段文案，业务可传入明确文案覆盖；操作按钮统一复用 `TldButton`，弹窗不复制按钮视觉。支持完整设置中的颜色/快捷键嵌套窗，内部层级注册只管理模态隔离，不管理业务弹窗队列或业务状态。
- 交互：默认展示右上角关闭按钮与“取消/确认”按钮，取消总是关闭，确认默认关闭；异步提交可设置 `closeOnConfirm={false}` 并由调用方根据结果关闭，提交期间通过 `confirmDisabled` 防止重复操作。Escape 和遮罩关闭可分别禁用，且只有最上层处理 Escape、Tab 和焦点进入；底层及页面通过 inert 隔离。第一层打开时保存 body 滚动状态，最后一层关闭时恢复，子窗不会提前解锁。子窗关闭恢复父窗原控件，最后关闭恢复原入口；父层先卸载时不抢占仍打开子层焦点。首次焦点在弹窗 frame 时，Tab/Shift+Tab 显式进入首/末控件；意外外部焦点和仅一个控件也保持双向循环。
- 遮罩关闭在pointerdown时先preventDefault，再通知关闭，防止浏览器默认聚焦body覆盖已经恢复的入口焦点；正文点击、禁用遮罩关闭和非最上层不受影响。`dialog-behavior.test.ts`验证取消默认动作的顺序/关闭策略，错误反馈生产专项使用真实mouseDown/mouseUp验证入口焦点恢复，不能只用程序化click声称该路径已验收。
- 响应式：`small` / `medium` / `large` 的最大宽度分别为 420 / 576 / 742px，新增 `extra-large` 为802px，默认 `large`；`full` 填满遮罩可用宽度，不新增猜测的设计最大宽度、桌面最小高度或整页缩放。H5 保留 12px 安全边距，高度随内容自适应，不继承桌面的最小高度；取消/确认按钮始终同排等宽，间距 12px，单按钮占满操作区。平板与 PC 保留 220/280/320px 最小高度及底部居中 180px 按钮，超高内容仅在对话框内滚动。正文消费全局 body 语义字号，标题保留 Dialog 已确认的 20/22px 规格；隐藏标题时关闭图标缩为 24px，但保留 40px 点击区。
- 扩展：`titleAlignment="center"` 使用对称标题内边距居中标题；`footer` 自定义底部插槽优先于默认操作项，业务负责其中按钮及校验，仍在滚动正文之外并参与焦点限制；传 null 可明确隐藏底部内容。用 `showCancelButton` / `showConfirmButton` 独立控制操作项，用 `showHeader` 控制可视标题区；业务表单、上传、校验和提交错误继续由所属 page/feature 通过插槽实现，不下沉到对话框。
- 验证：`dialog-behavior.test.ts` 覆盖 Escape/遮罩的独立关闭策略及首次/首尾/单项/无控件的双向焦点转换；`dialog-layer.test.ts` 覆盖顶层优先级、重复注册与乱序卸载；TldDialog.test.ts 覆盖包括 full 在内的变体、自定义底部的预渲染 Portal 延迟；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 端按 Figma 1920×1080 核对 742px 宽度、渐变边框、右上角关闭和底部居中按钮；768×1024 平板与 390×844 H5 的视觉和真机兼容由用户验收。

density=compact为真实紧凑提示消费者提供无正文外层padding、20/28标题及分隔线；headerSpacing=tight对应13px上/横间距，standard紧凑为15px，既有standard密度默认不变。fit-medium/fit-wide最大宽470/563px，内容适高，无桌面min-height。showCloseButton默认true，可与closeOnEscape/closeOnBackdrop=false及隐藏取消操作组合实现不可关闭签到；业务状态仍归owner。Portal挂载后、焦点限制、滚动锁定和清理继续共享；runtime覆盖单按钮Tab循环与全部禁止关闭路径。

紧凑关闭图标使用Figma2130:21630原始20×20 SVG，默认图标仍保留。内容适高窗使用五层径向渐变边框dialog-border。

titleTone=soft用于俱乐部标题dark#D9D9D9，light映射primary，默认标题不变；紧凑关闭图标由headerSpacing定位到原稿槽位（tight x432/y18，standard x434/y20，470px基准）。
