# 路由

- `/ai-tutor` 与 `/ai-tutor/mentors/:mentorId/scenes/:sceneId` 懒加载 `pages/ai-tutor` 公共入口，沿用 AppLayout，支持直接访问。页面分别为选择与聊天静态 UI，参数由页面校验，不创建真实 AI 会话；返回目标与聊天路径由 app 注入。

- 外语课程详情：`/foreign-language-guide/courses/:courseId` 懒加载 `pages/foreign-language-course`；目录注入详情路径模板，详情注入目录返回路径。只为已有冰雪课程设计提供入口，未知 ID 明确展示暂未提供详情。

- 漫奇联创天使：`/collaboration` 懒加载 `pages/collaboration`，位于共享 AppLayout 下，支持侧栏进入、直接访问与刷新。

- 畅学 VIP：`/vip` 懒加载 `pages/vip-membership`，位于共享 AppLayout 下；页面默认按无有效会员装配，购买/续费状态由页面的用户状态输入决定，联创天使面板的跳转目标由 app 注入现有 `/collaboration` 路径。

- 奖品兑换中心：`/prize-center` 懒加载 `pages/prize-center`，位于共享 AppLayout 下；当前仅提供积分兑换缺省态，权益兑换与兑换记录保留空面板。

- 职责：使用 React Router 装配页面、懒加载、错误页和未知路径回退。
- 入口：`router.tsx` 导出 `router`。
- 约束：路由层只负责装配 page 公共入口；页面可以拥有页面私有 UI/状态，独立业务仍进入下层 slice。业务状态和请求不得堆入路由层，生产部署必须保留 History 回退。
- 笔记本课程包详情：`/profile/notes/courses/:coursePackageId` 懒加载 `pages/notebook-course`；一级页注入详情路径模板，二级页注入确定返回路径 `/profile/notes?view=course-packages`。两个 page 不互相导入，笔记区通过 widget 复用。
- 章节笔记：`/profile/notes/courses/:coursePackageId/chapters/:chapterId` 懒加载 `pages/notebook-chapter`。路由层注入父课程包路径模板和一级页回退目标，章节页返回时携带 `view=courses` 恢复课程列表。
- 扩展：新增页面先创建对应 page slice，再从 `router.tsx` 引用其根入口；`/` 提供学习首页静态编排，`/profile` 提供玩家资料静态页面，`/profile/knowledge-gaps` 提供查漏补缺静态分页列表，`/profile/notes` 提供笔记本双视图静态分页列表，`/profile/learning-progress` 提供学习进度静态分页列表，`/profile/favorites` 提供收藏分类、整卡多选和本地删除静态列表，`/profile/works` 提供作品整卡多选与本地删除确认静态列表，`/foreign-language-guide` 提供外语逆袭秘籍静态课程分页列表，`/collaboration` 提供联创天使静态权益和支付页，`/vip` 提供畅学 VIP 静态方案页，`/leaderboard` 提供固定头尾与内部滚动分页的学习排行榜，`/prize-center` 提供积分兑换缺省态与两个待设计稿面板，`/promotion/revenue` 提供推广收益概览与佣金静态分页列表，`/branch-company` 提供分公司结算概览与奖励静态分页列表，`/courses/search` 仍是空白功能区域，`/login` 是不套用 App Shell 的独立静态路由。
- 验证：`pnpm run build && pnpm run lint`。
- `/awakening` 与 `/awakening/courses/:courseId` 懒加载 `pages/awakening`，位于共享 AppLayout 下，支持直接访问与刷新；详情支持音标课程静态预览，未知 ID 提供返回入口。面包屑固定，简介与章节区域内部滚动。
