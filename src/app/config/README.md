# 应用配置

- AI 助教：`routePaths.aiTutor` 为 `/ai-tutor`，`aiTutorChat` 为 `/ai-tutor/mentors/:mentorId/scenes/:sceneId`；两级页均归属 AI 助教导航，路径由 app 注入，mentor/scene 查询参数仅用于返回选择页时恢复单选状态。

- 外语课程详情：`foreignLanguageCourse` 为 `/foreign-language-guide/courses/:courseId`，当前静态示例 ID 为 `winter-speaking`；详情与目录路径分别注入两级 page，导航通过目录前缀匹配。

- 职责：维护应用内导航项与语义化路由路径。
- 顶栏动作：`utilityItems` 的意见反馈项显式声明 `action: 'feedback'`，由壳层打开反馈 feature；没有 action 的入口仍只展示，不推断业务行为。
- 侧栏导航：“风采大赛”与“奖品兑换中心”按设计顺序位于排行榜之后；当前未提供页面契约，保持无目标静态项，不伪造路由。
- 漫奇联创天使：`routePaths.collaboration` 为 `/collaboration`，侧栏项通过该真实路由高亮并支持直接访问。
- 畅学 VIP：`routePaths.vipMembership` 为 `/vip`，复用现有 `navigation.vip` 文案和图标，支持侧栏高亮与直接访问。
- 入口：`routes.ts` 导出学习首页 `/`、`/login`、`/profile`、`/profile/knowledge-gaps`、`/profile/notes`、`/profile/learning-progress`、`/profile/favorites`、`/profile/works`、`/foreign-language-guide`、`/collaboration`、`/vip`、`/leaderboard`、`/promotion/revenue`、`/branch-company` 与 `/courses/search`；`navigation.ts` 导出壳层的 `navigationItems`、`utilityItems` 和底部钻石入口 `footerNavigationItem`，登录落地页不进入该导航。
- 约束：资源 ID 使用领域路径参数；查询参数只表达筛选、排序、分页或 Tab 等可选视图状态。
- 笔记本二级路由：`notebookCourse` 为 `/profile/notes/courses/:coursePackageId`，参数标识课程包笔记索引；一级页的 `view=course-packages` 恢复按课程包页签。笔记本导航使用前缀匹配，涵盖二级页。
- 章节笔记路由：`notebookChapter` 为 `/profile/notes/courses/:coursePackageId/chapters/:chapterId`；课程包页 `view=courses` 恢复课程列表。章节路径包含所属课程包，两级参数必须同时校验。
- 扩展：新增路由时同步 router、导航（如适用）、当前阶段所需中文文案与相关页面说明；未实现的侧栏入口保持无目标状态，不伪造路由。
- 验证：`pnpm run build && pnpm run lint`。
- 言灵觉醒入口为 `routePaths.awakening`（`/awakening`），侧栏复用既有名称和图标，接通静态课程目录。
- 课程详情模板 `routePaths.awakeningCourse`（`/awakening/courses/:courseId`）传入目录页；详情页返回路径由 app 注入，保持言灵觉醒侧栏归属。
