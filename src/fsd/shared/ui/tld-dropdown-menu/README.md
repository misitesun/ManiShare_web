# TLD 动作下拉菜单

- 职责：通过具名图标触发器展示动作列表，选择后关闭并同步执行回调；使用`menu/menuitem`语义，不保存选择值。单选排序/筛选仍由`TldSelect`承担。
- 入口：根`index.ts`导出泛型`TldDropdownMenu`、`TldDropdownMenuProps`、`TldDropdownMenuItem`。调用方提供`label`、`trigger`、唯一`id`/`label`/可选`icon`的`items`与`onAction`；可成对提供`open/onOpenChange`控制展开，省略时由组件持有。可选`expanded/controls`表达实际受控面板的展开关系，非选中值。
- 约束：首次SSR及水合不访问DOM，挂载后创建body Portal；菜单z50低于模态层z60、高于普通浮窗，右对齐到触发器。宽208px并以可视视口两侧12px夹紧，项高44px，最大高480px/剩余视口空间，必要时向上展开和内部滚动；滚动/resize/visualViewport变化重新定位，触发器被响应式隐藏后关闭。颜色、字号、图标和表面仅消费现有主题token；图标由调用方提供，组件不包含业务图标或命令。
- 交互：原生点击/Enter/Space触发一次，打开聚焦第一项，ArrowUp/End打开时聚焦末项；方向键循环、Home/End定位、Esc关闭返回触发器、Tab关闭后按触发器位置继续自然焦点顺序。选项激活前先返回触发器并关闭，再同步调用`onAction`，保持全屏等用户手势及后续模态焦点归还。菜单内键盘不冒泡到页面动作；外点/失焦关闭，空白外点返回触发器，可聚焦目标正常获得焦点。没有模态遮罩、滚动锁或焦点陷阱。
- 动画：沿现有下拉风格使用150ms透明度/轻位移/缩放，关闭立即inert、aria-hidden且不可命中；复用`TldMovingHighlight tone="surface"`竖向移动高亮，文字/图标在高亮之上。reduced-motion直接切换；定位、外点和尺寸监听在关闭/卸载时清理。
- 外点焦点边界：程序化聚焦容器的`tabIndex=-1`不被当成点击聚焦目标；其内部空白/标题关闭菜单时仍返回触发器。原生输入、按钮、链接及可键盘到达的自定义目标继续正常聚焦。生产专项同时验证这两条路径，避免把页面根容器误判为用户点击的控件。
- 扩展：当前是少量同步动作；子菜单、异步项、搜索、持久化选择和业务判断不属于当前API。外部不得深层导入定位/键盘实现。
- 验证：同目录测试覆盖焦点循环、视口夹紧/向上定位、空项与SSR确定性；生产练习导航专项验证Portal层级、键盘/点击、焦点恢复、断点变化、双主题和缩放。运行`pnpm run format`、`pnpm run test`、`pnpm run lint`、`pnpm run build`。PC视觉由Codex验收，平板/H5触摸和真机待用户验收。
