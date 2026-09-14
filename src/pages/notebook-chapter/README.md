# 章节笔记页

- 职责：展示选中章节的静态笔记列表，按设计截图只保留返回入口和笔记组，不重复课程包概要与页签。
- 入口：根 `index.ts` 导出 `NotebookChapterPage`，由 app 懒加载到 `/profile/notes/courses/:coursePackageId/chapters/:chapterId`。
- 约束：`coursePath` 与 `notebookPath` 由 app 注入；参数通过 entities/notebook 查询，未知章节显示空态并返回有效课程包的课程列表，未知课程包回到笔记本按课程包视图。正常返回显式携带 `?view=courses`，不依赖浏览历史。
- 复用：`NotebookNotes` 统一笔记组、记录行及 TldDialog 删除确认，章节之间使用课程包+章节 key 隔离本地状态。添加/编辑仍为已有静态入口；删除仅影响当前组件实例，重新进入恢复演示数据。
- 响应式：与笔记本统一 mainPage 留白，H5 12px，平板及普通 PC 16px，≥1920px 250px；无固定版心最大宽度，笔记组整行自适应。
- 扩展：真实笔记/章节接口、编辑和新增流程确认后替换静态数据；保留明确父路径、无效参数处理和共享笔记 UI。
- 验证：实体章节测试覆盖八个章节查询、两组笔记及 2/3 条记录、无效参数、跨章节/课程 ID 隔离；运行 test/lint/build。手工检查卡片进入、刷新、返回恢复课程列表、删除取消/确认及未知参数，PC/平板/H5 视觉由用户验收。
