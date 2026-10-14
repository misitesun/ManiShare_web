# 共享配置

`application.version` 从 package.json 提供系统版本；`storageKeys.learningPreferences` 登记本机学习偏好，领域校验归 pages/settings，读写经 shared/lib/storage。

- 职责：维护环境值、应用默认值、功能开关、存储键、默认语言、时区和分页配置。
- 入口：`index.ts` 导出 `sharedConfig`、主题配置及其类型。
- 约束：只放环境/默认值/开关/存储键；稳定项目标识放入 `shared/constants`，领域枚举留在业务 slice。`locationPromptConfirmed` 只表示用户确认看过首页定位提示，不表示已授予定位权限。
- 扩展：新增环境变量、存储键或主题时同步模板、类型、实现、文档与验证。
- 验证：`pnpm run lint && pnpm run build`；变更存储或主题行为时补相应测试。

locale固定zh-CN且仅注册中文，默认值不再受英文环境值影响；runner对语言值仅允许zh-CN。历史language键仅用于旧数据清理，启动不读写或恢复旧语言。

dailyCheckin/homeClubPrompt登记版本化本地模拟签到和俱乐部提示payload；领域校验分别归features/daily-checkin与pages/home，不代表账号接口状态。
