# 共享配置

`application.version` 从 package.json 提供系统版本；`storageKeys.learningPreferences` 登记本机学习偏好，领域校验归 features/learning-settings，读写经 shared/lib/storage。

- 职责：维护环境值、应用默认值、功能开关、存储键、默认语言、时区和分页配置。
- 入口：`index.ts` 导出 `sharedConfig`、主题配置及其类型。
- 约束：只放环境/默认值/开关/存储键；稳定项目标识放入 `shared/constants`，领域枚举留在业务 slice。`locationPromptConfirmed` 只表示用户确认看过首页定位提示，不表示已授予定位权限。
- 扩展：新增环境变量、存储键或主题时同步模板、类型、实现、文档与验证。
- 验证：`pnpm run lint && pnpm run build`；变更存储或主题行为时补相应测试。

locale固定zh-CN且仅注册中文，默认值不再受英文环境值影响；runner对语言值仅允许zh-CN。历史language键仅用于旧数据清理，启动不读写或恢复旧语言。

dailyCheckin/homeClubPrompt登记版本化本地模拟签到和俱乐部提示payload；领域校验分别归features/daily-checkin与pages/home，不代表账号接口状态。

外观背景图使用独立practiceBackgroundImage键（english-learning-practice-background-image-v1），避免每次学习偏好更新重写大图片；payload由features/learning-settings校验，经storage访问。无新环境变量或主题注册。

偏好与背景图键及 v1 payload 保持不变；app 单次装配 `LearningSettingsProvider`，独立 `/settings/` 与练习弹窗消费同源状态。shared 仍仅登记 unknown 技术容器，不反向导入 feature，不维护课程/练习配置领域规则。

练习自制 WAV/MP4 只用于播放器技术验证，地址由练习页面 owner 声明，不新增配置键、环境值或资源枚举；静态资源 MIME 属于 renderer 契约，shared/config 不承担媒体服务。

练习左上角选项使用独立practiceToolbarOptions键（english-learning-practice-toolbar-options-v1）。shared只登记unknown技术容器；version 1的family:mode作用域、实际可用字段、布尔/枚举校验、截图默认值和恢复/保存由pages/practice拥有。该键不混入全局learningPreferences，不缓存题目、输入、阶段、计时、媒体或菜单展开状态；不新增环境值、跨标签同步或Electron bridge。
