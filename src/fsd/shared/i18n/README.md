# 中文兼容词典

- 职责：仅加载zh-CN词典，为已有t()消费者提供中文；新文案直接使用中文，不再进行多语言处理。
- 入口：index.ts初始化i18next并导出i18n/defaultLanguage；AppProviders只加载初始化副作用，首次预渲染与客户端均为中文。
- 约束：无语言入口、切换Hook、英文加载或存储偏好恢复。sharedConfig.locale仅注册zh-CN；en-US.ts作为历史源码保留，不加载、不维护，不进行中英文键同步验收。历史language存储键仅为旧数据清理保留，初始化不读写。
- 扩展：已有词典调用确需调整时只维护中文；普通新功能不新增语言key。中文开发规则见AGENTS.md、开发规范及ADR0019。
- 验证：locales.test.ts验证中文初始化、必要兼容文案和无英文资源；runner测试拒绝en-US。runtime:smoke在隔离配置中注入旧英文偏好，刷新验证中文、无语言入口及无水合错误。
