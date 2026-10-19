# 设置独立页

- 职责：维护 `/settings/` 的独立页与 URL Tab 适配，不再拥有第二份偏好、背景图或设置表单。
- 入口：根 `index.ts` 导出 `SettingsPage`；app 的 `SettingsPageRoute` 在局部 Suspense 内装配，完整编辑能力来自 `features/learning-settings` 根入口。
- 约束：独立页读取 `?tab=` 并保留其它查询参数，切换使用 replace 与 `scroll:false`。未知值回到发音；旧 `sound` 映射特效、`listening` 映射专项。七 Tab 的表单、控件、预览、校验与保存只在共同 feature 维护，不允许练习页横向导入本 page。
- 状态：app 在共同上层装配唯一 `LearningSettingsProvider`。本页仅渲染 `LearningSettingsEditor` 的 `presentation="page"`，保留现有独立版心和 sticky 偏移；练习弹窗由练习页使用同一 Editor 的 dialog 变体和受控局部 Tab，不改练习 query。
- 扩展：新增分类及模型修改在 [完整设置能力](../../features/learning-settings/README.md) 同步；练习运行范围以 [开发文档第 7.6 节](../../../../docs/practice-page-development.md#76-完整设置弹窗持久化和共享所有者) 为准。显示完整配置不代表判题、朗读调度、真实录音评分或练习按键逻辑已经接通。
- 验证：模型与预览测试随公共能力迁移；此页回归 query 直达、切换、刷新、合法旧值与独立页面布局，执行 test/lint/build。PC 按实际设计尺寸读取计算样式和几何；平板/H5 视觉及真机兼容待用户验收。
