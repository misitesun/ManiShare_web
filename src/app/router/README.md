# 路由

- 职责：使用 React Router 装配页面、懒加载、错误页和未知路径回退。
- 入口：`router.tsx` 导出 `router`。
- 约束：路由层只负责装配 page 公共入口；页面可以拥有页面私有 UI/状态，独立业务仍进入下层 slice。业务状态和请求不得堆入路由层，生产部署必须保留 History 回退。
- 扩展：新增页面先创建对应 page slice，再从 `router.tsx` 引用其根入口；`/` 提供学习首页静态编排，`/profile` 提供玩家资料静态页面，`/profile/knowledge-gaps` 提供查漏补缺静态分页列表，`/profile/notes` 提供笔记本双视图静态分页列表，`/profile/learning-progress` 提供学习进度静态分页列表，`/profile/favorites` 提供收藏分类、整卡多选和本地删除静态列表，`/profile/works` 提供作品整卡多选与本地删除确认静态列表，`/foreign-language-guide` 提供外语逆袭秘籍静态课程分页列表，`/leaderboard` 提供固定头尾与内部滚动分页的学习排行榜，`/promotion/revenue` 提供推广收益概览与佣金静态分页列表，`/courses/search` 仍是空白功能区域，`/login` 是不套用 App Shell 的独立静态路由。
- 验证：`pnpm run build && pnpm run lint`。
