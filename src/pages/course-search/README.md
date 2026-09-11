# 课程搜索页

- 职责：承载 `/courses/search` 独立路由；当前仅接收顶栏搜索导航并提供无障碍命名的空白主内容占位。
- 入口：`index.ts` 导出 `CourseSearchPage`，仅由 app router 懒加载。
- 约束：课程接口、结果列表、筛选与错误状态尚未确认，不在占位阶段虚构；搜索词仅通过 `q` 查询参数传递。
- 扩展：接入真实搜索能力时补齐 idle/loading/success/empty/error 状态、数据校验、行为测试和中文文案；只在产品明确重新开启多语言时补充其他语言。
- 验证：`pnpm run lint && pnpm run build`，人工提交空查询和非空查询并确认进入独立路由。
