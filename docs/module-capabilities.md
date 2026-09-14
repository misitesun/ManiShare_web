# 漫奇说 Web 技术选型与基础能力地图

- 下拉单选：`shared/ui/tld-select` 提供受控 `TldSelect`，支持深浅主题、已选项反馈、键盘选择和外部关闭；业务排序由所属页面实现。菜单显隐支持过渡，关闭时 inert 隔离焦点。
- 表单控件：`shared/ui/tld-input` 提供 `TldInput`（焦点边框与淡阴影）；`shared/ui/tld-switch` 提供 `TldSwitch`（受控开关）；`shared/ui/tld-selection` 提供 `TldSelection`（圆形逐项 checkbox）。均支持可访问名称、禁用和主题色；选择和显隐动画遵循 reduced-motion，业务状态留在页面。

本文回答三个问题：框架已经提供什么、后续业务应该从哪里接入、哪些能力当前明确不做。详细约束仍以 `AGENTS.md`、专题文档和各模块 README 为准；本文件是导航和边界地图，不替代它们。

## 1. 项目目录

```text
漫奇说web/
├── src/
│   ├── app/             # 应用启动、路由、Provider、全局样式和配置装配
│   ├── pages/           # 路由入口、页面编排和页面私有实现
│   ├── widgets/         # 跨页面复用的完整界面区块
│   ├── features/        # 用户可感知的业务动作
│   ├── entities/        # 稳定业务对象
│   └── shared/          # 无业务归属的配置、基础设施和基础 UI
├── electron/            # Electron 主进程、preload 和桌面桥接
├── public/              # 确实需要固定 URL 的公开静态资源
├── scripts/             # 仓库校验、开发启动和资源处理脚本
├── docs/                # 架构、开发、兼容性、ADR 和能力文档
├── .agents/skills/      # 随仓库维护的 Codex 团队工作流
└── .github/workflows/   # 持续集成
```

`src` 遵守 `app → pages → widgets → features → entities → shared` 单向依赖。业务 slice 只经根 `index.ts` 暴露公共 API；`electron` 是同一 React renderer 的桌面宿主，不属于 FSD 层，也不能被业务组件直接导入。

业务资源跟随所属模块进入局部 `assets/`。`public/` 只保存需要固定 URL 的发布资源；禁止用 `public/` 或全局 `src/assets` 作为图片、图标和视频收纳目录。

## 2. 技术选型

| 技术 | 当前用途 | 边界 |
| --- | --- | --- |
| React 19 | 函数组件、Hook 和客户端渲染 | 不引入 Next.js、RSC 或服务端框架约定 |
| TypeScript strict | 请求、领域、组件与公共能力类型 | 禁止 `any`、非空断言和未校验外部数据 |
| Vite 8 | 开发服务器、环境模式和 Web 构建 | mode 仅允许 development、staging、production |
| Tailwind CSS 4 | 页面和组件样式、mobile-first 响应式、跨页面语义字号 | 颜色只来自语义主题 token；字号按角色缩放且在 1920px 达到设计上限；不并行维护 Sass/CSS Modules |
| React Router 7 | 语义路由、页面懒加载和错误边界 | 路由源在 `app/config`，页面从根入口装配 |
| i18next | 保留初始化、已有 `zh-CN` / `en-US` 资源和切换基础 | 当前新页面默认直接展示中文，暂不扩展多语言翻译 |
| GSAP + `@gsap/react` | 交互动效和 React 生命周期管理 | 只从 `shared/lib/animation` 导入，限定作用域并尊重 reduced-motion |
| React Bits | 候选动画、文字和背景的可调整源码来源 | 已按源码方式接入 Aurora 用于登录页，保留默认波带并翻转纵向方向；其余组件仍按真实消费者逐个引入并适配本仓库契约 |
| OGL 1.0.11 | 登录页 Aurora 的轻量 WebGL renderer | 只由 `pages/login` 的页面私有视觉消费；不作为通用 3D 场景层，不暴露 Node/Electron API |
| Electron | 安全桌面壳和窄 preload/IPC | renderer 不接触 Node/Electron API |
| pnpm 10.28.2 | 唯一依赖与命令执行器 | lockfile 唯一；安装脚本使用精确白名单 |
| EditorConfig + Prettier 3 | 源代码、脚本和配置的统一格式 | 4 个空格缩进、禁止 Tab；Markdown、生成锁文件和静态资源不机械改写 |
| Oxlint + 项目脚本 | 类型、FSD、Tailwind、模块文档和 Skill 契约 | 不通过放宽检查脚本绕过真实违规 |
| Node Test Runner + tsx | 公共能力和脚本单元测试 | 组件/E2E 等真实需求出现后再选型 |

## 3. 公共能力入口

| 能力 | 唯一入口 | 已提供 | 当前不负责 |
| --- | --- | --- | --- |
| 应用配置 | `src/shared/config` | 环境、API 默认值、语言、时区、分页、存储键、主题注册 | 用户文案、领域枚举、业务规则 |
| 项目标识 | `src/shared/constants` | 品牌名、工作名、缩写和跨页面共享的小管家形象 | 可翻译文案、课程或用户数据 |
| HTTP | `src/shared/api` | 方法封装、查询参数、超时、认证头、`HttpError` | 领域端点、DTO 校验、缓存、自动重试 |
| 主题 | `src/shared/theme` 与 `src/app/styles/index.css` | dark/light 注册、应用、持久化、语义 token、切换过渡 | 组件内主题分支、业务颜色硬编码 |
| 响应式字号 | `src/app/styles/index.css` | 页面/区块/卡片标题、正文、标签、辅助文字、页签和强调操作的 mobile-first 语义 utility | 根字号缩放、统一 `vw` 倍率、特殊品牌或排行榜视觉 |
| i18n 基础 | `src/shared/i18n` | 初始化、已有中英文资源、语言切换能力 | 当前新页面的英文翻译、自动翻译、学习内容语言模型 |
| Web Storage | `src/shared/lib/storage` | `StorageSchema` 约束的 LocalStorage 访问 | SessionStorage 直连、数据库或服务端会话 |
| 时间 | `src/shared/lib/time` | locale 和默认 IANA 时区的日期时间展示 | 学习日历、连续天数和倒计时业务规则 |
| 剪贴板 | `src/shared/lib/clipboard` | 非空文本复制和布尔结果 | 用户提示 UI |
| 下载 | `src/shared/lib/download` | Blob/URL 下载和临时 URL 回收 | 导出格式、内容权限和文件业务规则 |
| 动画 | `src/shared/lib/animation` | GSAP 注册、`gsap` 与 `useGSAP` 稳定入口 | 跨页面全局时间线或具体业务动画编排 |
| 通知 | `src/shared/notification` | success/info/warning/error/confirm 统一入口 | 业务文案和权限判断 |
| 通用按钮 | `src/shared/ui/tld-button` | 主/次文字按钮、统一尺寸、整行宽度、交互光标和禁用态 | 业务点击状态、图标按钮、导航页签或链接语义 |
| 返回入口 | `src/shared/ui/tld-back-button` | Figma 箭头、统一外观、显式目标的 Link 导航和自定义文案 | 猜测历史栈、业务取消确认和路径拼装 |
| 渐变文字 | `src/shared/ui/tld-gradient-text` | 可传颜色、速度、方向、往返、hover 暂停和可选边框的动态渐变文字 | 业务文案、点击行为、筛选状态或页面级动画 |
| 会员标签 | `src/shared/ui/tld-membership-badge` | 黄金 VIP、终身 VIP、漫奇天使和免费体验的图标、渐变底托与三档尺寸 | 用户权益、会员状态判断和业务文案 |
| 进度展示 | `src/shared/ui/tld-progress-bar` | 数值归一化、可选数值文案、两档比例轨道和无障碍进度语义 | 业务进度计算、请求或状态所有权 |
| 列表分页状态 | `src/shared/ui/tld-pagination-status` | 触底自动加载哨兵、加载中、无更多和失败重试反馈 | 页码、接口、列表数据和领域错误规则 |
| 通用页签 | `src/shared/ui/tld-segmented-tabs` | 受控单选页签、分段渐变/下划线展示与基础无障碍语义 | 业务筛选状态、路由和页签文案 |
| Tooltip 文字提示 | `src/shared/ui/tooltip` | Portal 定位、四方向、自定义高度与 hover/focus 交互 | 业务文案、触发条件或导航状态 |
| Dialog 对话框 | `src/shared/ui/tld-dialog` | 受控 Portal、渐变边框、响应式尺寸、内容插槽、统一操作按钮、焦点与关闭策略 | 业务表单、提交状态、接口错误或全局弹窗队列 |
| PWA 预留 | `src/shared/lib/pwa` | 安装生命周期监听与状态 Hook | manifest、Service Worker、离线缓存和发布 |

新增公共能力前先搜索现有入口。页面私有 UI、Hook、状态和资源默认留在 `pages/<page>`；只有独立用户业务进入 `features`，跨页面大型组合进入 `widgets`。第二个真实消费者只触发重新判断；确认能力没有业务语义后，才下沉到双方共同允许依赖的最低层。不能先建 `shared/utils`、`hooks` 或 `services` 等万能目录。

## 4. 应用与多端能力

| 能力 | 所有者 | 当前契约 |
| --- | --- | --- |
| 路由 | `src/app/config/routes.ts`、`src/app/router/router.tsx` | `/` 是学习首页静态编排，`/courses/search` 使用空白功能区域，`/profile` 是玩家资料页，`/profile/knowledge-gaps` 是查漏补缺静态分页列表，`/profile/notes` 是笔记本双视图静态分页列表，`/profile/learning-progress` 是学习进度静态分页列表，`/profile/favorites` 是我的收藏分类、整卡多选与本地删除静态列表，`/profile/works` 是我的作品整卡多选与本地删除静态列表，`/foreign-language-guide` 是外语逆袭秘籍静态课程分页列表，`/leaderboard` 是固定头尾与内部滚动分页的学习排行榜，`/promotion/revenue` 是推广收益概览与佣金静态分页列表，`/login` 为独立品牌首屏 |
| 课程集合编辑 | `src/features/edit-course-collection` | 我的收藏与我的作品共用浏览/编辑、整卡多选、取消和本地删除状态；页面仍分别拥有数据、筛选、分页和提示文案 |
| 笔记本二级页 | `src/pages/notebook-course` | `/profile/notes/courses/:coursePackageId` 课程包概要、全部笔记和八个章节卡片；`view=courses` 恢复课程列表 |
| 章节笔记页 | `src/pages/notebook-chapter` | `/profile/notes/courses/:coursePackageId/chapters/:chapterId` 展示对应章节笔记，返回恢复课程列表，未知参数显示空态 |
| 共享笔记区 | `src/widgets/notebook-notes`、`src/entities/notebook` | 两级页面统一记录展示、删除确认和演示数据；分页由一级页拥有，新增/编辑仍为静态入口 |
| 响应式壳层 | `src/widgets/app-layout` | 同一开关状态驱动跨端侧栏动画；H5 使用不推动主内容且可完全离场的覆盖式抽屉，`md` 平板与 `xl` PC/Electron 在 200px 侧栏和保留头像/导航图标的 64px 轨道间切换，1920px 宽屏展示完整标签文案 |
| 学习首页 | `src/pages/home` | 1920px 三栏基准布局、超宽屏 1720px 居中容器、固定前三名舞台和包含 50 条静态数据的内部滚动榜单；平板/H5 使用同一语义 DOM 重排 |
| 登录落地页 | `src/pages/login` | Figma 静态布局、黑白主题、三端响应式与从底部向上展开的 React Bits Aurora 流动光带；表单、认证和跳转待独立需求 |
| Electron | `electron/`、`electron-builder.yml` | Web/H5/Electron 共用 renderer；桌面能力只通过具名 preload API 与校验 sender 的 IPC |
| 兼容性知识 | `docs/compatibility.md` | 运行时差异必须进入登记契约，明确 fallback、cleanup、自动验证和人工复测 |

响应式不是整体缩放设计画布。默认样式服务 H5，`md:` 和 `xl:` 只在必要位置重排、扩容或调整字号；PC 设计值可以精确实现，平板和 H5 仍可以用明确的 class 指定大小，也可以在设计允许时使用 `clamp()` 做有上下限的流式变化。

## 5. Hook 与状态放置

Hook 是封装 React 状态、生命周期、事件处理或外部同步的函数，不是单独的架构层。项目不建立统一 `src/hooks`：

- 业务动作的 Hook 放在所属 `features/<feature>`；
- 稳定领域状态放在所属 `entities/<entity>`；
- 页面或 widget 私有 Hook 留在自己的 slice；
- 主题、语言、动画等无业务且已有公共契约的 Hook 才从命名明确的 `shared` 能力暴露。

状态只提升到真实消费者的最近共同所有者。可由 props/state 推导的值在渲染中计算；Effect 只用于同步外部系统，并负责清理监听、计时器、订阅和可继续运行的异步工作。

## 6. 依赖与供应链边界

新增依赖先说明现有能力、标准 Web API 或更小方案为什么不足。运行时依赖用 `pnpm add`，开发依赖用 `pnpm add -D`，并同步 `package.json`、`pnpm-lock.yaml`、文档和 CI。

pnpm 依赖安装脚本默认拒绝执行，`pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 是唯一白名单：

- `esbuild`：Vite 与 tsx 构建需要的本地二进制。

没有实际依赖消费者的包不得保留在白名单中。`electron-winstaller` 的安装脚本仍被拒绝；当前 Electron Windows 目标是 NSIS，不能仅为消除安装提示而批准未使用的 Squirrel 辅助包。

新增白名单必须审查安装脚本、下载/编译行为、产物影响和替代方案，记录包名、用途与风险，并仅执行 `pnpm approve-builds <明确包名>`。禁止全量批准。

## 7. 验证与非目标

默认验证：

```bash
pnpm run format:check
pnpm run test
pnpm run lint
pnpm run build
```

只有 Electron 边界或桌面构建受影响时再运行 `pnpm run desktop:build`。视觉或响应式任务仍需面向 390×844、768×1024、1440×900 实现，但 Codex 只人工验收 PC（优先任务指定的桌面尺寸，未指定时为 1440×900）；平板/H5 的视觉与真机兼容由用户验收，并在交接中标为待用户验收。相关主题、reduced-motion 和运行时降级按实际受影响范围复测。

当前明确不预建课程、练习、笔记、用户档案、音频、录音、语音识别、AI 教学、全局状态、请求缓存或完整 PWA 能力。它们必须在真实需求、数据契约和多端行为确认后，按 FSD 建立对应模块。
- `TldInput` 同时服务查漏补缺和 AppLayout 顶部搜索，统一 hover/focus 绿色边框，提供 medium/large 尺寸与 trailingAction 尾部操作槽；不负责业务搜索或路由。
- 收藏与作品编辑的选择覆盖层统一消费 `TldSelection layout="card"`：整卡原生 checkbox 点击区、右上角圆形指示器、主题底色与选中动画；不再维护独立选中/未选中图片。
- `TldSelection` 使用白色对号标记选中，`tone="selection"`（默认）为绿色普通选择，`tone="danger"` 为红色删除选择；作品/收藏编辑覆盖层使用 danger，查漏补缺保持默认。
- `TldSegmentedTabs` 分段变体复用单个滑动渐变背景（300ms），百分比几何自动适配父容器尺寸和横向滚动，reduced-motion 下立即切换；不新增浏览器监听或依赖，underline 保持原样。
- `TldDialog` H5 高度随内容自适应，操作按钮同排等宽，单按钮占满操作区；md 及以上保留原有尺寸与最小高度，正文仍可内部滚动。
- 言灵觉醒：`pages/awakening`，路由 `/awakening`，三排静态选项、原稿课程封面与分页演示；`/awakening/courses/:courseId` 提供音标课程详情静态预览，固定面包屑、简介与章节共同内部滚动，复用进度条和开关。收藏/助手仅本地展示状态，学习、重置、筛选业务待接口确认。
