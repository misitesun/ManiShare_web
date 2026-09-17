# 排行榜页

- 周期与指标均复用 `shared/ui/tld-moving-highlight` 的 TldMovingHighlight；页面只提供容器 ref、activeKey 与选项标记，删除原先按周期枚举的固定 transform class。周期支持横/竖排重排，指标保留胶囊左右端造型。

- 周期和指标滑块层级：导航建立 isolate 层叠上下文；hover 背景单独放在 z-0，高亮为 z-10，文字为 z-20。按钮自身不设置 z-index，不把悬停背景和文字一起提升到高亮上方。

- 职责：提供学习排行榜静态页面，包含周榜/月榜/年榜/总榜周期切换、时长/积分指标切换、分页加载榜单和固定当前用户排名栏。
- 入口：`index.ts` 只导出 `LeaderboardPage`，由 `app/router` 懒加载装配到 `/leaderboard`。
- 约束：页面私有静态数据、分页状态、榜单行和 Figma 资源保留在本 slice；用户会员身份复用 `shared/ui/tld-membership-badge`，分页反馈复用 `shared/ui/tld-pagination-status`。当前不定义排行接口、统计口径或真实筛选规则。
- 布局：页面固定占满 App Shell 顶栏之外的视口高度，页面整体不滚动；周期导航、标题、列头和当前用户栏保持固定，只有榜单列表内部纵向滚动并在触底时加载下一页。周期选中边框使用单一指示器平滑移动，H5 重排为横向四列并横向移动，平板/PC 使用左侧纵向导航并纵向移动；系统启用减少动态效果时保持即时切换。
- 扩展：接入真实数据时在页面 model 中增加 DTO 校验、加载/失败/空状态和各周期、指标的数据源；业务规则稳定并出现跨页面消费者后再评估提升层级。
- 验证：运行 `pnpm run format:check && pnpm run test && pnpm run lint && pnpm run build`。PC 重点检查 1440×900 与 1920×1080 下页面无整体滚动、固定头尾与列表内部触底分页；平板/H5 视觉和真机兼容由用户验收。
