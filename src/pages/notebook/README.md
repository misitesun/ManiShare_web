# 笔记本页

- 职责：承载 `/profile/notes` 静态笔记本页面，按 Figma 展示“全部笔记”和“按课程包”两种列表，并复用共享分段页签与触底分页状态。
- 入口：`index.ts` 导出 `NotebookPage`，由 app router 懒加载并注入 `coursePath`；`?view=course-packages` 恢复“按课程包”页签。
- 约束：静态演示数据归属 `entities/notebook`，首屏分别展示 3 个句子组与 12 个课程包，触底追加第二页。笔记 UI、操作图标和本地删除统一归属 `widgets/notebook-notes`，删除前使用 `TldDialog` 确认；新增/编辑仍为静态入口。课程封面从 `entities/course-package` 获取。中文文案不新增 i18n key；跨页不持久化本地删除或分页进度。
- 扩展：接入接口时先以 `unknown` 校验 DTO，再由页面或独立 feature 驱动 `idle/loading/exhausted/error`；接入服务端删除时保留共享确认流程，并补充提交中、成功和失败反馈。新增/编辑表单仍待确认。课程包整卡导航至 `/profile/notes/courses/:coursePackageId`。
- 响应式：≥1920px 时以侧栏右侧主内容区为基准左右各留 250px，取消版心最大宽度；笔记组保持整行伸展，课程包按最小 290px 卡宽自动排布列数。1280～1919px 不设版心最大宽度，左右统一各 16px，既有列数不变；同一视口和侧栏状态下与其余四页内容边界对齐；平板/H5 边距不变。
- 字号：页签、笔记标题、记录正文、课程卡标题和操作标签使用全局响应式语义字号，1920px 保持设计稿上限。
- 验证：`model/pagination.test.ts` 覆盖分页状态转换，共享笔记区的 deletion 测试覆盖本地删除，实体测试覆盖全部课程卡片的详情查询；运行 `pnpm run test && pnpm run lint && pnpm run build`。PC 核对统一版心、课程卡进入二级页和返回恢复页签；按本次任务要求，PC、平板/H5 视觉及真机兼容均由用户验收。
