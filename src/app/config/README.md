# 应用配置

- AI 助教：`routePaths.aiTutor` 为 `/ai-tutor`，侧栏使用现有 `navigation.aiTutor` 与图标；只提供导师/场景静态选择入口。

- 外语课程详情：`foreignLanguageCourse` 为 `/foreign-language-guide/courses/:courseId`，当前静态示例 ID 为 `winter-speaking`；详情与目录路径分别注入两级 page，导航通过目录前缀匹配。

- 职责：维护应用内导航项与语义化路由路径。
- 入口：`routes.ts` 导出学习首页 `/`、`/login`、`/profile`、`/profile/knowledge-gaps`、`/profile/notes`、`/profile/learning-progress`、`/profile/favorites`、`/profile/works`、`/foreign-language-guide`、`/leaderboard`、`/promotion/revenue` 与 `/courses/search`；`navigation.ts` 导出壳层的 `navigationItems` 和 `utilityItems`，登录落地页不进入该导航。
- 约束：资源 ID 使用领域路径参数；查询参数只表达筛选、排序、分页或 Tab 等可选视图状态。
- 笔记本二级路由：`notebookCourse` 为 `/profile/notes/courses/:coursePackageId`，参数标识课程包笔记索引；一级页的 `view=course-packages` 恢复按课程包页签。笔记本导航使用前缀匹配，涵盖二级页。
- 章节笔记路由：`notebookChapter` 为 `/profile/notes/courses/:coursePackageId/chapters/:chapterId`；课程包页 `view=courses` 恢复课程列表。章节路径包含所属课程包，两级参数必须同时校验。
- 扩展：新增路由时同步 router、导航（如适用）、当前阶段所需中文文案与相关页面说明；未实现的侧栏入口保持无目标状态，不伪造路由。
- 验证：`pnpm run build && pnpm run lint`。
- 言灵觉醒入口为 `routePaths.awakening`（`/awakening`），侧栏复用既有名称和图标，接通静态课程目录。
- 课程详情模板 `routePaths.awakeningCourse`（`/awakening/courses/:courseId`）传入目录页；详情页返回路径由 app 注入，保持言灵觉醒侧栏归属。
