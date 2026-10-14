# Client 路由装配

- 职责：每个路由单独装配页面、路径回调与局部 Suspense；共享 App Shell 与 Provider。
- 入口：各 PageRoute、AppShell、AppProviders；由 Next page/layout 导入。
- 约束：不再维护独立 router；不把函数从 Server 传到 Client。登录与两个PK状态页独立布局，其余25个路由复用壳层；SettingsPageRoute 使用局部 Suspense，AppShell 注入 settingsPath。PkArenaPageRoute 装配 `/pk/` 首页，侧栏 PK 入口接通 routePaths.pkArena。CompetitionPageRoute 装配 `/competition/` 静态未开放页，侧栏风采大赛入口接通 routePaths.competition。未知页面静态 404 文档保持原默认回首页行为，缺失资源没有 HTML 回退。
- 扩展：新增动态路由时使用 owner 根入口的纯参数枚举器，不复制 ID 列表。
- 验证：274 个业务 HTML、全部 RSC 与真实 Client 导航。

- 登录视图：LoginPageRoute的局部Suspense包围查询读取；app装配 view 与 onViewChange，解析和查询转换经 pages/login 根公共入口。/login/?view= 表达介绍、五种登录、三种注册；replace保留其他查询值、scroll:false，不向Server传函数，不新增静态页面集合，不把敏感输入写入URL。

- PK状态：PkMatchingPageRoute装配取消返回大厅/开始加载；新增(pk-session)路由分组保持全屏，无AppShell，不变更根AppProviders或Electron桥。
