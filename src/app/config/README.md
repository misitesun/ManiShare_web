# 应用配置

- 职责：维护应用内导航项与语义化路由路径。
- 入口：`routes.ts` 导出学习首页 `/`、`/login`、`/profile`、`/profile/knowledge-gaps`、`/profile/notes`、`/profile/learning-progress`、`/profile/favorites`、`/profile/works`、`/foreign-language-guide`、`/leaderboard`、`/promotion/revenue` 与 `/courses/search`；`navigation.ts` 导出壳层的 `navigationItems` 和 `utilityItems`，登录落地页不进入该导航。
- 约束：资源 ID 使用领域路径参数；查询参数只表达筛选、排序、分页或 Tab 等可选视图状态。
- 扩展：新增路由时同步 router、导航（如适用）、当前阶段所需中文文案与相关页面说明；未实现的侧栏入口保持无目标状态，不伪造路由。
- 验证：`pnpm run build && pnpm run lint`。
