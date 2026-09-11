# 课程包实体

- 职责：集中维护笔记本、我的收藏与我的作品共同展示的静态课程包标识、中文标题和 Figma 封面资源。
- 入口：从 `src/entities/course-package` 导入 `coursePackages`、`coursePackageCatalog` 与 `CoursePackageSummary`。
- 约束：这里只描述稳定课程包摘要，不承载笔记数量、作品共享状态、分页、删除或页面交互；封面由 Figma 原始资源优化得到并只在本 slice 保留一份。
- 扩展：接入真实接口时先校验外部 DTO，再映射为领域对象；新增稳定课程包资源时同步目录、公共目录与真实消费者，页面私有展示字段仍留在页面。
- 验证：运行 `pnpm run test && pnpm run lint && pnpm run build`，并在消费页面执行 PC 视觉验收。
