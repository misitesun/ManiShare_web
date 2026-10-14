# 0019：界面与开发统一中文

## 决定

2026-10-14用户确认移除侧栏语言入口，后续只进行中文开发，不再做多语言处理。移除LanguageSwitcher和useAppLanguage，shared/i18n仅加载zh-CN供旧页面t()调用；新增文案直接中文。历史en-US源码不参与运行、维护或英文同步验收，不要求全站改写旧t()。

所有环境的NEXT_PUBLIC_DEFAULT_LANGUAGE必须是zh-CN，runner拒绝en-US或其他值；sharedConfig的默认值和支持列表也固定中文。AppProviders不再恢复历史语言存储。旧english-learning-language键为清理旧数据而保留，不读写、不自动删改用户存储。

## 影响图

环境runner/模板 → shared/config → shared/i18n初始化 → AppProviders及现有t()消费者。AppLayout移除语言入口，固定中文不影响主题、路由或真实学习内容中的英文词句。AGENTS、开发规范、AI协作指南、团队Skill与模块说明同步采用中文开发契约。无新增依赖、存储键或Electron bridge。

## 验证

单测验证中文初始化、无英文资源和环境值限制。生产Web/Electron冒烟注入旧英文存储并刷新，检查中文壳层、无语言选择器和水合错误。设置/PK/首页截图直接使用中文，不再借助语言选择器。
