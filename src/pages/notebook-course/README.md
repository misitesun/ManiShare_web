# 课程包笔记二级页

- 职责：实现 Figma `779:7050` 的课程包概要与全部笔记，以及 `779:4803` 的八个章节卡片列表。
- 入口：根 `index.ts` 导出 `NotebookCoursePage`，app 懒加载到 `/profile/notes/courses/:coursePackageId`；一级笔记本“按课程包”整卡链接进入。
- 约束：`backPath` 和 `chapterPath` 由 app 注入；返回到 `/profile/notes?view=course-packages`，章节卡片整卡 Link 进入 `/profile/notes/courses/:coursePackageId/chapters/:chapterId`。本页 `?view=courses` 表达课程列表，直达/刷新及章节返回均可恢复；缺省或未知 view 显示全部笔记。路径参数必须匹配实体索引，未知课程显示明确空态和返回入口。侧栏仍高亮笔记本。
- 数据与交互：使用 entities/notebook 的静态演示数据及 entities/course-package 的已有封面；共享 `NotebookNotes` 与一级页保持笔记 UI、删除确认一致。切换页签不卸载笔记区。课程列表展示第一至第八章，每章卡片计数来自其笔记组数组，点击进入对应章节。封面数量沿用之前设计 fixture，不将章节演示数据反向汇总到封面或一级列表；本地删除不跨页面持久化。
- 响应式：遵循 mainPage 统一版心：H5 左右 12px、平板和 1280～1919px 左右 16px、≥1920px 左右 250px，无页面最大宽度。概要在窄屏重排；PC 封面保持 321:218 比例，使用语义字号与主题 token。章节卡片最小高度 148px，H5 单列、平板两列、普通 PC 四列，≥1920px 按最小 290px 卡宽 auto-fill 自动增减列数。
- 扩展：新增/编辑表单、真实课程章节关系和接口另按已确认业务交付。页面不引用另一个 page slice，返回按钮复用 `TldBackButton`，章节图标使用本页 Figma 原始导出资源。
- 验证：执行 test/lint/build；验收路径为一级页切“按课程包”→海洋主题词汇→课程列表→任一章节→删除取消/确认→返回恢复课程列表，补查直达、刷新与未知 ID。按用户要求，PC、平板/H5 视觉与真机验收均由用户执行。
