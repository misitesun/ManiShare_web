# 外语逆袭秘籍

- 职责：承载 `/foreign-language-guide` 静态课程目录，按 Figma 展示课程横幅、分类状态、响应式课程卡与触底分页。
- 入口：根目录 `index.ts` 仅导出 `ForeignLanguageGuidePage`，由应用路由懒加载。
- 约束：横幅和课程封面是本页面私有 Figma 导出资源；分类与立即开通暂不接业务流程，课程数据为静态分页演示数据。已加载条目始终进入同一个网格，避免分页边界造成断层；分页观察与状态文案复用 `shared/ui/tld-pagination-status`，立即开通复用 `shared/ui/tld-button`。
- 响应式：H5 单列、平板和常规 PC 两列；常规 PC 采用主内容区 16px 边距，≥1920px 采用 250px 边距，并以 562px 为卡片可读最小宽度自动增减列数。横幅和课程封面在窄屏保持裁切可读，不使用整页缩放。
- 主题：只消费语义主题颜色，图片资源保持原始色彩；深浅主题均不在页面内写主题分支。
- 课程详情：`courseDetailPath` 由应用路由注入，冰雪口语训练营整卡 Link 进入 `/foreign-language-guide/courses/winter-speaking`，包含分页追加的同课程条目。其他课程尚无详情设计，保留展示；详情由独立 `pages/foreign-language-course` 提供，两页不互相导入。
- 扩展：分类筛选、其他课程详情、开通流程和真实接口确认后分别补充 URL 状态、业务 feature 与 loading/empty/error 状态；不要在静态页面中虚构支付行为。
- 验证：`model/pagination.test.ts` 覆盖分页边界；运行 `pnpm run format:check && pnpm run test && pnpm run lint && pnpm run build`。PC 以 1920×1080 对照 Figma，平板/H5 视觉与真机兼容由用户验收。
