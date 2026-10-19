# Next 适配层

- 职责：App Router 路由、布局、Metadata 和静态参数适配。
- 入口：layout.tsx；各路由 page.tsx。
- 约束：只传递可序列化参数，业务/UI 在 src/fsd；函数依赖在 FSD app Client 装配。
- 扩展：动态路径从 owner 根入口导出的纯枚举器生成。
- 验证：typegen、类型检查、目标 275 业务 HTML、29 路由契约与 production 导航冒烟；本轮实际验证结果另记。

- 练习适配：`(practice-session)/practice/page.tsx` 只挂载 FSD app 的 `PracticePageRoute`，不套用 `(shell)` 布局；`demo` / `mode` 为本地演示查询，不增加动态参数或 HTML 集合。根 `AppProviders` 持有唯一学习设置 Provider，独立设置页和练习完整弹窗共用其状态。1920px 精确视觉、较窄 PC 重排、平板/H5 验收与产物枚举分别记录，不因适配文件存在视为已通过。

练习自制技术 WAV/MP4 位于 `public/practice-demo`，以固定同源 URL 发布，由 FSD page 注入播放器并标注非课程素材；Next adapter 不新增资源 loader、媒体服务或动态路由。预览/Electron 的 MIME 登记由静态 renderer 契约负责，CSP与bridge边界保持。
