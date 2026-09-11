# TLD 通用页签

- 职责：提供受控的单选页签，统一分段渐变和下划线两种展示、非活动项、键盘焦点与 `tablist` / `tab` 语义。
- 入口：从 `src/shared/ui/tld-segmented-tabs` 导入 `TldSegmentedTabs`、Props、展示变体与页签项类型；`variant` 默认为 `segmented`，明细导航使用 `underline`。
- 约束：组件只管理展示与点击回调，不持有业务筛选状态，不解释页签值，也不包含业务文案；调用方为每项提供稳定 ID 和对应面板 ID；页签文案统一使用全局 tab-label 响应式语义字号，窄屏溢出由调用方提供局部滚动容器。
- 扩展：出现真实的禁用项或方向键 roving focus 需求时，在本组件统一扩展并补行为测试，不在业务页面复制样式。
- 验证：运行 `pnpm run test && pnpm run lint && pnpm run build`；PC 检查活动态、悬停态和可见焦点，平板/H5 视觉与真机兼容由用户验收。
