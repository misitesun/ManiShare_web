# Client 路由装配

- 职责：每个路由单独装配页面、路径回调与局部 Suspense；共享 App Shell 与 Provider。
- 入口：各 PageRoute、AppShell、AppProviders；由 Next page/layout 导入。
- 约束：不再维护独立 router；不把函数从 Server 传到 Client。登录独立布局，其余 22 个路由复用壳层。未知页面静态 404 文档保持原默认回首页行为，缺失资源没有 HTML 回退。
- 扩展：新增动态路由时使用 owner 根入口的纯参数枚举器，不复制 ID 列表。
- 验证：269 个业务 HTML、全部 RSC 与真实 Client 导航。
