# Next 适配层

- 职责：App Router 路由、布局、Metadata 和静态参数适配。
- 入口：layout.tsx；各路由 page.tsx。
- 约束：只传递可序列化参数，业务/UI 在 src/fsd；函数依赖在 FSD app Client 装配。
- 扩展：动态路径从 owner 根入口导出的纯枚举器生成。
- 验证：typegen、类型检查、269 业务 HTML 与 production 导航冒烟。
