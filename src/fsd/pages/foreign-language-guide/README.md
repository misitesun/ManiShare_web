# 外语逆袭秘籍

- 职责：承载 `/foreign-language-guide/` 静态课程目录，按 Figma 展示课程横幅、分类状态、响应式课程卡与触底分页。
- 入口：根目录 `index.ts` 仅导出 `ForeignLanguageGuidePage`，由应用路由懒加载。
- 约束：横幅和课程封面是本页面私有 Figma 导出资源；分类复用 `TldSegmentedTabs semantics="filter"` 展示受控选中和动态下划线，但暂不执行数据过滤；立即开通也暂不接业务流程。课程数据为静态分页演示数据，已加载条目始终进入同一个网格；分页观察复用 `shared/ui/tld-pagination-status`，立即开通复用 `shared/ui/tld-button`。
- 响应式：H5 单列、平板和常规 PC 两列；常规 PC 采用主内容区 16px 边距，≥1920px采用用户确认的254px设计边距（架构默认250px的页面例外），并以 562px 为卡片可读最小宽度自动增减列数。横幅和课程封面在窄屏保持裁切可读，不使用整页缩放。
- 课程封面：用户2026-10-14确认按Figma `1:2226` 恢复562:250比例，各视口随宽度等比裁切，不设固定250px高度。PC封面圆角20px；横向内距含边框18px、顶部含边框20px，基准封面562×250、卡片598×370。宣传横幅桌面高度230px，详情页海报不在本次范围。
- 页签：`TldSegmentedTabs typography="display" gap="spacious" size="compact"` 内容布局、局部居中。基准字号/行高24/34，字距0.01em，活动字重500、非活动400，文案间距60px，accent-green活动文字及48×4指示线。H5为16/24和24px间距，md为20/28和40px间距，≥1920px达上限。1920px宽、100%缩放、200px侧栏下：横幅(454,100)1212×230，文案y350、指示线y390、卡片y414、封面(472,434)。
- 主题：只消费语义主题颜色，图片资源保持原始色彩；深浅主题均不在页面内写主题分支。
- 课程详情：`courseDetailPath` 由应用路由注入，冰雪口语训练营整卡 Link 进入 `/foreign-language-guide/courses/winter-speaking/`，包含分页追加的同课程条目。其他课程尚无详情设计，保留展示；详情由独立 `pages/foreign-language-course` 提供，两页不互相导入。
- 扩展：分类筛选、其他课程详情、开通流程和真实接口确认后分别补充 URL 状态、业务 feature 与 loading/empty/error 状态；不要在静态页面中虚构支付行为。
- 验证：`model/pagination.test.ts` 覆盖分页边界；运行 `pnpm run format:check && pnpm run test && pnpm run lint && pnpm run build`。PC 以 1920×1080 对照 Figma，平板/H5 视觉与真机兼容由用户验收。

- 统一封面动效（2026-10-19）：课程封面复用 [TldTiltedCover](../../shared/ui/tld-tilted-cover/README.md)，沿用本页既有槽位、比例和圆角，只让内部图片随鼠标倾斜/轻微放大并显示光泽。原链接、播放入口、选择和角标保持；收藏/作品编辑态停用动效。触屏与减少动态效果保持静态，离开/失焦/滚动/卸载清理；PC交互专项与平板/H5待用户验收边界见公共组件说明。
