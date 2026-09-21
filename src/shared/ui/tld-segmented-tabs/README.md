# TLD 通用页签

- 职责：提供受控的单选页签与筛选选项组，统一分段渐变和动态下划线两种展示、悬停、键盘焦点和选中反馈。
- 入口：从 `src/shared/ui/tld-segmented-tabs` 导入 `TldSegmentedTabs`、Props、项类型及视觉配置类型；`variant` 默认为 `segmented`，文字页签使用 `underline`。
- 约束与语义：`semantics="tabs"` 要求每项提供 `panelId`，输出 `tablist` / `tab`；`semantics="filter"` 输出按钮组和 `aria-pressed`，用于言灵觉醒等没有独立 tabpanel 的筛选器。组件只回传 ID，不持有或解释业务状态。
- 下划线：活动文字和横线颜色分开配置；横线宽度支持固定像素、文字宽度或整个分段，厚度支持三档，底部灰线可关闭并可选 `strong` / `subtle` 主题色。`layout` 控制等分或随文字排列，窄屏溢出仍由调用方局部滚动。
- 动画：分段背景与下划线均从当前左右边缘开始，先拉伸覆盖旧、新位置，再在落点收缩并回弹。下划线复用 `TldMovingHighlight`测量真实 DOM 几何，支持不同文案宽度、横向滚动和容器 resize；快速切换从当前形变继续。动画只经 `shared/lib/animation` 使用 GSAP，不使用 opacity 切换，`prefers-reduced-motion` 下立即到位。
- 扩展：禁用项、方向键 roving focus 或拖拽需求必须在本组件统一扩展并补行为测试；不在业务页复制动画。拖拽当前不实现，避免与 H5 横向滚动手势冲突。
- 验证：组件测试覆盖两种语义、渐变文字、横线目标与底线开关；运行 `pnpm run test && pnpm run lint && pnpm run build`。PC 检查默认位置、左右快速切换、hover、可见焦点和 reduced-motion；平板/H5 视觉与真机兼容由用户验收。
