# 架构约定

- AI 助教归属 `pages/ai-tutor`，由 app 在 `/ai-tutor` 及 `/ai-tutor/mentors/:mentorId/scenes/:sceneId` 懒加载并复用壳层。导师、场景、聊天静态示例、输入状态与资源为页面私有，不新增 features/widgets 或接口。选择页保持响应式网格；聊天页按用户要求一屏展示，导师栏和输入区固定，场景与消息内部滚动；切换导师显式返回父页并恢复选择。

## 总体分层

项目采用 Feature-Sliced Design：

```text
app → pages → widgets → features → entities → shared
```

高层可以依赖低层，低层禁止依赖高层。除 `app` 和 `shared` 外，同层 slice 禁止直接互相导入。业务 slice 的唯一公共入口是根 `index.ts`。

`pnpm run lint:source-contracts` 使用 TypeScript AST 阻断反向依赖、业务同层 slice 互相依赖以及跨公共模块深层导入。不要通过改写相对路径、兼容重导出或放宽校验绕过归属问题。

## 各层职责

| 层 | 负责 | 不负责 |
| --- | --- | --- |
| `app` | Provider、Router、全局样式、应用级配置装配 | 领域规则 |
| `pages` | 路由入口、页面编排和页面私有 UI/model/assets | 可跨页面复用的业务实现 |
| `widgets` | 跨页面的大型组合区块 | 应用级反向依赖 |
| `features` | 用户动作与业务流程 | 通用基础设施 |
| `entities` | 稳定领域对象 | 页面编排 |
| `shared` | 无业务语义的基础设施和公共 UI | 课程、练习等领域规则 |

例如未来“提交练习”应进入 `features/submit-exercise`，练习领域结构进入 `entities/exercise`，路由页面只组合它们。

### 轻量 FSD

轻页面优先内聚，而不是把每个子组件都提升为公共 slice：

| 判断 | 所有者 |
| --- | --- |
| 只服务一个页面，删除页面时也应删除 | 留在 `pages/<page>` 的 `ui`、`model`、`lib` 或 `assets` |
| 可独立描述的用户动作或业务流程 | `features`；可以暂时只有一个页面消费者 |
| 跨页面复用的完整大型组合区块 | `widgets` |
| 跨场景复用的小型无业务组件 | `shared/ui` |
| 被多个流程共同使用的稳定领域对象 | `entities` |

第二个真实消费者是重新判断归属的信号，不是自动进入 `widgets` 的规则。文件变长时先在原所有者内部按职责拆文件；只有所有权改变时才跨 FSD 层移动。

## 路由

资源 ID 使用语义化路径参数：

```text
/courses/:courseId
/courses/:courseId/lessons/:lessonId
/courses/search
/
/profile/learning-progress
/profile/notes
/profile/notes/courses/:coursePackageId
/profile/notes/courses/:coursePackageId/chapters/:chapterId
/profile/notes/:noteId
/profile/favorites
/profile/works
/foreign-language-guide
/foreign-language-guide/courses/:courseId
/leaderboard
/branch-company
/profile
/login
```

查询参数仅用于筛选、排序、分页和 Tab 等可恢复视图状态。路由表由 `src/app/config/routes.ts` 维护，路由装配在 `src/app/router/router.tsx`。

`/profile/notes/courses/:coursePackageId` 已实现课程包笔记二级静态页，归属 `pages/notebook-course`；参数是课程包笔记索引，不是单条笔记 ID。`/profile/notes/:noteId` 仅为未来单条笔记资源的路径示例，当前未注册。一级 `?view=course-packages` 表达按课程包视图，返回入口显式保留该参数。笔记本导航前缀匹配覆盖二级页面。

两级笔记页共同依赖 `widgets/notebook-notes`（笔记组/记录 UI 与本地删除确认）和 `entities/notebook`（记录模型及演示数据），页面仍拥有分页、路由和页签。课程标题/封面由页面组合 `entities/course-package`，实体之间不建立同层依赖。通用返回入口使用 `shared/ui/tld-back-button`，目标由调用方提供，避免直达二级页时依赖未知浏览历史。

课程包的课程列表由八个静态章节卡片组成，整卡 Link 进入 `/profile/notes/courses/:coursePackageId/chapters/:chapterId`（`pages/notebook-chapter`）。章节页同样复用 `NotebookNotes`，显示截图对应笔记组；通过明确课程包父路径加 `?view=courses` 返回列表，直达、刷新也保持该行为。章节模型及示例数据属于 entities/notebook，页面之间不互相导入。课程包和章节的 URL 参数分别查询校验，不能将未知章节默认为第一章。

`/login` 是不套用 App Shell 的独立品牌首屏。`/` 套用 App Shell 并提供学习首页静态编排；`/profile` 提供玩家资料静态页面，`/profile/notes` 提供笔记本双视图静态分页列表，`/profile/learning-progress` 提供学习进度静态分页列表，`/profile/favorites` 提供我的收藏分类、分页、整卡多选与本地删除，`/profile/works` 提供我的作品分页、整卡多选与本地删除确认，`/foreign-language-guide` 提供外语逆袭秘籍静态课程分页列表，`/leaderboard` 提供固定头尾与内部滚动分页的学习排行榜，`/courses/search` 保留后续业务使用的空白功能区域；课程搜索词使用 `q` 查询参数。真实公告、学习统计、排行榜数据请求、资料请求、搜索、课程开通和认证动作确认后再建立对应 feature。

## App Shell 边界

`widgets/app-layout` 提供响应式壳层，但不知道 app 层导航配置。导航条目、静态标签和搜索路径由 `app` 创建并以 props 注入，避免 widget 反向依赖 app。

壳层负责：

- PC 与平板使用可收起侧栏和顶部栏；展开时占据 200px 布局列，收起时保留 64px 头像与导航图标轨道，并使用同步宽度动画；
- H5 使用覆盖式抽屉导航，完全收起后离场，弹出时不改变或推动主内容布局；
- 全局课程搜索路由入口和第一版静态功能标签；
- 内容滚动容器和 Safe Area；
- 主题、界面语言入口；
- Outlet 承载。

壳层不负责课程检索、会员状态、学习进度或任何具体业务。

## 响应式架构

Tailwind v4 使用 mobile-first：

| 范围 | 约定 |
| --- | --- |
| 默认 | 手机 H5；单列、完全离场的覆盖式抽屉导航、Safe Area |
| `md` | 平板；默认保留 64px 图标轨道，可展开为 200px 侧栏 |
| `lg` | 紧凑桌面宽度；首页使用两列过渡布局 |
| `xl` | PC/Electron；默认展开 200px 侧栏，可收起为 64px 图标轨道；1280～1439px 首页保持两列，达到 1440px 后恢复设计稿三列位置并流式收缩列宽 |
| `3xl` | 1800px 及以上宽屏增强；首页保持 1720px 最大宽度，仅在视口达到 1920px、展开侧栏后剩余宽度足够时恢复设计稿固定列宽 |

首页 PC 三列布局同时以扣除 80px 顶栏后的视口高度为最小高度。设计稿 1080px 高度下保留原始几何；视口更高时，只由排行榜列表和学习花园承接额外高度，禁止为撑满高度缩放整页内容。

布局规则由真实 UI 所有者维护：页面私有布局留在 page，可复用组件维护自身布局。不要建立独立“mobile 页面”或复制两套 DOM；同一语义结构通过断点重排。只有真实交互语义不同且共享 DOM 会显著恶化时，才允许拆分视图。

### 响应式语义字号

`src/app/styles/index.css` 是跨页面字号阶梯的唯一 owner，通过 Tailwind `@theme inline` 暴露 `text-page-title`、`text-section-title`、`text-card-title`、`text-body`、`text-label`、`text-caption`、`text-tab-label` 和 `text-action-label`。页面和共享组件按内容语义选择 utility，不复制一套自己的同名断点数值。

字号采用 mobile-first：默认值覆盖 H5，`md` 提升到平板，`xl` 调整普通 PC，≥1920px 达到设计稿尺寸上限并保持不再增长。页面标题允许比正文拥有更大的跨端变化；正文、标签和辅助文字分别保留自己的可读性下限，因此禁止统一倍率、根字号缩放、`vw` 字号或整页画布缩放。排行榜数字、登录品牌首屏、极小会员徽标等与固定几何强绑定的视觉可以留在所属 owner，并使用明确断点或局部有界缩放。

共享按钮、页签、Dialog 与 AppLayout 应直接消费这些语义 utility，使业务页面只决定文字角色。添加新角色前必须有至少两个真实消费者，或证明既有角色无法表达；变更阶梯数值需要同步本章节、全局样式 README、影响页面和 PC 验收。取舍见 [ADR 0015](./decisions/0015-responsive-semantic-typography.md)。

### mainPage 版心与列表适配

App Shell 内的常规列表/管理页默认采用以下规则，玩家档案的查漏补缺、笔记本、学习进度、我的收藏、我的作品是当前实例。这里的 mainPage 指路由页主内容区，不是新增组件或全局业务 class。登录、首页多栏仪表盘、编辑器等特殊布局不自动套用；有明确不同需求时，在页面 README 记录例外。

| 视口宽度 | 版心约定 |
| --- | --- |
| <768px | 新同类页面默认左右 12px，现有 H5 边距按所属页面约定保持 |
| 768～1279px | 新同类页面默认左右 16px，现有平板边距按所属页面约定保持 |
| 1280～1919px | 主内容区左右统一各 16px；版心填满扣除边距后的可用宽度，不保留页面级固定最大宽度或额外居中留白 |
| ≥1920px | 取消页面最大宽度，主内容区左右各 250px，版心随剩余宽度伸展 |

边距以侧栏右侧的主内容区为基准，不以整个浏览器窗口为基准；侧栏展开或收起后由同一流式布局重新计算，不在 JS 中维护窗口宽度或重复计算侧栏占用。同类页面统一从以下容器开始，纵向间距由页面自行补充：

```tsx
<section className="mx-auto min-w-0 px-3 md:px-4 xl:min-[1920px]:px-[250px]">
  {/* 页面内容 */}
</section>
```

不得保留从单张设计稿继承的页面级 `xl:max-w-[1212px]`、`xl:max-w-[1334px]` 等固定上限，也不得用 `xl:px-0` 清掉留白。相同视口和侧栏状态下，同类页面的内容左右边界必须对齐；只有 padding 相同但叠加不同自动居中 margin 不算满足约定。局部页签、弹窗等组件可以保持自己的合理宽度限制。避免在壳层和页面重复添加同一组边距；特殊页面只有在用户明确确认不同版心需求后才可记录例外，不得仅因旧代码或设计稿存在固定宽度而沿用。

卡片数量不是设计稿的固定契约。宽屏网格使用 `auto-fill/minmax`，按可用宽度与内容可读性自动增减列数，不永久锁死三列或四列；最小卡宽由实际内容确定，不要求所有卡片使用同一值。现有五页在 ≥1920px 使用该策略：错题卡最小 380px，课程包、收藏与作品卡最小 290px；笔记组和学习进度保留横向整行列表并随版心伸展。五页较窄 PC 的旧版心上限已统一移除，该区间已有列数以及平板/H5 的布局保持不变。

上述精确像素覆盖使用 `xl:min-[1920px]:` 组合变体。当前 Tailwind 编译中，单独的 px 任意断点会排在 rem 命名断点之前，导致宽屏规则被 `xl` 覆盖；组合变体已通过 1920px 与 2560px 浏览器计算样式验证。维护时应核对实际边距与列数，不依赖 class 字符串书写顺序判断覆盖关系。

PC 验收需覆盖 1280px、1400px、1500px、1919px、1920px 和至少一个更宽视口（如 2560px），在相同视口和侧栏状态下横向对比同类页面的实际内容左右边界，检查精确留白、阈值切换、自动列数、侧栏展开/收起、横向溢出与少量数据不异常拉伸。不能只检查 padding、单个页面或单张设计稿尺寸。平板/H5 视觉与真机兼容仍由用户验收。取舍见 [ADR 0014](./decisions/0014-main-page-content-layout.md)。

## 主题与设计 token

主题由三个边界协作：

1. `shared/config/theme.ts` 注册合法主题；
2. `shared/theme` 负责状态、DOM `data-theme` 和存储；
3. `src/app/styles/index.css` 定义主题原始值并通过 `@theme inline` 映射 Tailwind 语义 utility。

组件只能消费语义 utility，不知道当前主题名。新增 token 先判断是否跨组件稳定；业务局部视觉仍用现有 Tailwind 色义组合，不能把页面文案或领域状态塞入全局 token。

## 资源归属与提升

```text
features/save-note/
├── assets/
├── model/
├── ui/
├── README.md
└── index.ts
```

资源默认跟随第一个真实拥有者。第二个真实消费者出现时，移动到两者共同允许依赖的最低层，并通过公共入口导出；禁止复制文件或深层导入同层 slice。

`src` 未引用资源必须随功能删除。位图优化由 `pnpm run assets:optimize` 显式执行，不进入 build/CI。固定 URL 资源才进入 `public/`。

## Hook 归属

| Hook 类型 | 位置 |
| --- | --- |
| 页面私有状态或视觉交互 | `pages/<page>/model` 或 `ui` |
| 用户动作 | `features/<feature>/model` |
| 稳定领域状态 | `entities/<entity>/model` |
| 组合布局交互 | 对应 `widgets/<widget>/model` 或 `ui` |
| 浏览器通用能力 | `shared/lib/<capability>` |
| 应用装配 | `app` 对应技术 segment |

禁止集中 `src/hooks`。公共 Hook 经所属模块 `index.ts` 导出。

## 目录粒度

一个目录只能描述一个概念，同一概念的实现、类型、测试、样式、说明和入口可以共存。出现第二个可独立演进概念时新建子目录。内部拆文件不会自动产生公共 slice；禁止万能 `utils`、`types`、`services`。

## shared/lib 边界

当前稳定能力为：

| 能力 | 公共入口 |
| --- | --- |
| 动画 | `shared/lib/animation` |
| 剪贴板 | `shared/lib/clipboard` |
| 下载 | `shared/lib/download` |
| PWA 安装生命周期 | `shared/lib/pwa` |
| 存储 | `shared/lib/storage` |
| 时间 | `shared/lib/time` |

新增能力必须有真实消费者、独立目录、公共入口、模块 README 和必要测试。领域算法留在 `entities` 或 `features`。

## 公共 UI 命名空间

新增共享无业务组件使用：

```text
shared/ui/tld-button/
├── TldButton.tsx
├── README.md
└── index.ts
```

目录以 `tld-` 开头，React 导出为 `Tld<Component>`。样式直接由字面量 Tailwind class 表达。业务 slice 不使用 `tld-`。

## 模块说明

`pnpm run lint:module-docs` 检查：

- `src/app` 及其公共技术 segment；
- `features` 根；
- `shared/api`、`config`、`constants`、`i18n`、`notification`、`theme`；
- `entities`、`features`、`pages`、`widgets`、`shared/lib`、`shared/ui` 中拥有根入口的子目录。

README 至少包含“职责、入口、约束、扩展、验证”。资源目录、纯内部 `model`/`ui` 和空目录不机械建文档。

## 自动化源码契约

`pnpm run lint:source-contracts` 当前检查：

- FSD 依赖方向和业务同层 slice 隔离；
- `pages`、`widgets`、`features`、`entities` 以及公开 shared 能力的根入口；
- renderer 不导入 Node.js/Electron，业务不绕过 `shared/api` 直接调用 `fetch`；
- 业务代码不绕过 `shared/lib/animation` 直接导入 `gsap` 或 `@gsap/react`；
- `className` 使用完整字面量分支，组件不使用原始 Tailwind 调色板、主题 variant 或内联原始颜色；`tld-gradient-text` 的无样式外层可原样转发调用方 `className` 以承载布局，但不得将该值与内部 Tailwind 外观拼接；
- `src/app/styles/index.css` 是 `src` 内唯一 CSS 入口，并用 `source("../..")` 只扫描 renderer 源码；原始色值只存在于主题 token 声明。

校验器位于 `scripts/validate-source-contracts.mjs`，fixture 测试位于相邻测试文件。新增路径别名、公共模块形态或合法样式能力时，必须同步契约、脚本与测试，不能只添加忽略。

## Electron 边界

Electron 是薄壳：

- `src/` 保持浏览器兼容；
- `electron/main.ts` 管窗口、协议、导航和 IPC；
- `electron/preload.cts` 只暴露具名桥接方法；
- renderer 禁止 Node integration；
- Web 与桌面共用生产 renderer。

任何文件、媒体、通知、更新或系统集成都必须先定义权限、失败路径、Web 回退和兼容性契约，再扩展 bridge。
