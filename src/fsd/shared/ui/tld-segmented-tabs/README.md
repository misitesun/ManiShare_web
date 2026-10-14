# TLD 通用页签

- `typography="comfortable"` 为16/24→18/26→≥1920px20/28，0.01em字距，content布局取消按钮横向padding、文字对齐顶部、指示线位于底边内，底线2px；`gap="generous"` 的content容器45px高、文案间距24→40→≥1920px70px。推广奖励显式使用，原default/compact/display/regular消费者不变；受控选择、面板关联和动效仍复用现有能力。

- 展示变体：`typography="display"` 消费全局tab-label-display阶梯（H5 16/24、md20/28、≥1920px24/34），字距0.01em，内容布局取消横向padding、指示线落在底边内；搭配compact size时高度44→48→54px。`gap="spacious"` 为24→40→60px文案间距。外语逆袭秘籍显式使用，原默认消费者不变；受控选择、筛选ARIA与动画保持现有能力。实际样式和几何由浏览器核验。

underline 的 item 宽度测量标记包含 aria-hidden 文案副本；交互测试使用可访问名称或 aria-controls 关系定位，不以整个按钮 textContent 严格等于文案定位。设置页运行时冒烟采用该关系。

- 职责：提供受控的单选页签与筛选选项组，统一分段渐变和动态下划线两种展示、悬停、键盘焦点和选中反馈。
- 入口：从 `src/fsd/shared/ui/tld-segmented-tabs` 导入 `TldSegmentedTabs`、Props、项类型及视觉配置类型；`variant` 默认为 `segmented`，文字页签使用 `underline`。
- 约束与语义：`semantics="tabs"` 要求每项提供 `panelId`，输出 `tablist` / `tab`；`semantics="filter"` 输出按钮组和 `aria-pressed`，用于言灵觉醒等没有独立 tabpanel 的筛选器。组件只回传 ID，不持有或解释业务状态。
- 下划线：活动文字和横线颜色分开配置；横线宽度支持固定像素、文字宽度或整个分段，厚度支持三档，底部灰线可关闭并可选 `strong` / `subtle` 主题色。`layout` 控制等分或随文字排列，窄屏溢出仍由调用方局部滚动。
- 紧凑设计变体：`typography="compact"` 使用全局tab-label-compact字号/行高（H5 14/20、md以上16/22）、0.01em字距，内容布局按钮取消横向padding，下划线落在组件底边内；`gap="compact"` 的文案间距为H5 16px、md20px、xl36px。查漏补缺显式启用，两项默认值保持原样，不改变设置等已有消费者。测量标记只负责宽度，不产生可见或可操作的纵向溢出。
- 动画：分段背景与下划线均从当前左右边缘开始，先拉伸覆盖旧、新位置，再在落点收缩并回弹。下划线复用 `TldMovingHighlight`测量真实 DOM 几何，支持不同文案宽度、横向滚动和容器 resize；快速切换从当前形变继续。动画只经 `shared/lib/animation` 使用 GSAP，不使用 opacity 切换，`prefers-reduced-motion` 下立即到位。
- 扩展：禁用项、方向键 roving focus 或拖拽需求必须在本组件统一扩展并补行为测试；不在业务页复制动画。拖拽当前不实现，避免与 H5 横向滚动手势冲突。
- 验证：组件测试覆盖两种语义、渐变文字、横线目标与底线开关；运行 `pnpm run test && pnpm run lint && pnpm run build`。PC 检查默认位置、左右快速切换、hover、可见焦点和 reduced-motion；平板/H5 视觉与真机兼容由用户验收。

- 中性分段：`appearance="neutral"` 显式提供32px高、灰色分隔边界和选中背景，字号沿用tab-label-compact。仅影响segmented展示，不改变受控ID、ARIA、点击及reduced-motion策略；默认brand和underline消费者保持原样。

- 常规文字设计变体：underline/content布局显式使用`typography="regular"`，消费tab-label-regular（16/22→md18/25），40px高、文字顶部对齐、按钮无横向padding和额外字距、指示线在底边内；`gap="spread"`在这一布局提供24→md64→≥1920px130的文字边缘间距。用于奖品兑换中心，原有布局和默认消费者不变。

- outlined仅用于segmented筛选：32px内层置于调用方1px渐变边框后为34px，黑/浅色语义canvas底，渐变选中与竖分隔；选中文字14/20，未选中16/22。PK榜单显式选择；受控ID、ARIA、动画与reduced-motion保持，其他外观不变。
