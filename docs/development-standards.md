# English Learning Web 开发规范

本规范适用于人工与 AI 协作者。当前工作名为 English Learning；正式品牌确认前，所有品牌默认值必须集中在环境配置、项目常量和 Electron 配置中，页面不得散落硬编码。

> 规则优先级：用户当前需求 > 本文档 > 现有模块约定 > 个人习惯。需求改变公共契约时，代码、规范、Skill、ADR 和验证必须同步。

## 1. 协作原则

1. 一次改动解决一个明确目标，不顺带设计未确认的学习业务。
2. 模块通过根 `index.ts` 暴露能力；外部不得深层导入实现文件。
3. 先复用后抽象；第二个真实消费者出现后再提升公共能力。
4. 公共行为、依赖、环境、路由、主题、响应式或 Electron 边界变化时，同步文档。
5. 包管理器唯一使用 pnpm `10.28.2`，禁止 npm、yarn、npx、bun。
6. 新页面或新能力实现前完成[需求就绪清单](./feature-delivery-checklist.md)；路由与业务同时变化时组合使用功能交付和跨切面 Skill。
7. 新增依赖先证明现有封装或浏览器标准 API 不能满足需求；安装期脚本默认拒绝，只有审查过的精确包名可以进入 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies`。

### 1.1 代码格式化

- 源代码、脚本和配置文件统一使用 4 个空格缩进，禁止 Tab。项目不接受“2 空格与 4 空格混用”或“个人编辑器设置决定缩进”。
- 根目录 `.editorconfig` 负责编辑器默认值，`prettier.config.mjs` 负责可重复的机械格式；两者均以 4 空格和 `useTabs: false` 为准。
- 修改代码后运行 `pnpm run format`；`pnpm run format:check` 只检查不写入，并已纳入 `pnpm run lint` 和 CI。
- Markdown 文档、生成的 `pnpm-lock.yaml` 和静态资源不由 Prettier 机械改写；文档中的代码示例仍应展示 4 空格缩进。

## 2. FSD 分层

依赖方向固定为：

```text
app → pages → widgets → features → entities → shared
```

| 层 | 职责 | 英语学习示例 |
| --- | --- | --- |
| `app` | 应用装配 | Provider、路由、全局样式、导航配置 |
| `pages` | 路由级入口、页面编排和页面私有实现 | 登录页、注册页、个人档案页 |
| `widgets` | 跨页面大区块 | App Shell、课程目录、学习摘要 |
| `features` | 用户可感知动作 | 收藏课程、提交练习、记录笔记 |
| `entities` | 稳定业务对象 | 课程、课时、单词、学习记录 |
| `shared` | 无业务含义的基础设施 | API、主题、i18n、存储、基础 UI |

除 `app` 和 `shared` 外，同层不同 slice 禁止直接依赖。路由使用语义化资源路径，例如 `/courses/:courseId/lessons/:lessonId`；查询参数只表达筛选、排序、分页、Tab 等可选视图状态。

### 2.1 轻量 FSD 与提取条件

- 登录、注册、只读个人资料等单一职责页面默认在 `pages/<page>` 内聚开发。只服务该页面、页面删除时也应删除的组件、Hook、状态、动画和资源留在所属 page 的 `ui`、`model`、`lib` 或 `assets`。
- `features` 承载可以独立描述的用户业务动作或业务流程，例如登录、修改密码、收藏课程。feature 是否成立由业务职责、状态、API 和测试边界决定，不要求先出现第二个页面消费者。
- `widgets` 只承载跨页面复用的完整大型界面区块。多处调用只是提取信号；小型无业务组件应考虑 `shared/ui`，稳定领域展示应考虑 `entities`。
- 不因文件较长、出现一个子组件或“未来可能复用”就建立新的公共 slice。先在真实所有者内拆小文件，达到独立职责或真实复用条件后再移动，并在同一变更删除旧公共入口。

## 3. 目录与公共入口

- 模块和目录使用小写短横线。
- 一个目录只承载一个可命名概念；禁止万能 `hooks`、`utils`、`components`、`services` 或 `types`。
- Hook 跟随业务 slice 的 `model`/`ui`，或进入命名明确的 `shared/lib/<capability>`。
- 页面私有组件和 Hook 可以在 `pages/<page>/ui`、`model` 内拆分文件，不需要为了拆文件提升到 `features` 或 `widgets`。
- 有公共边界的 slice、app segment、shared 能力和 shared UI 维护根 `README.md`，至少写职责、入口、约束、扩展和验证。
- 新增 `shared/ui` 组件使用 `tld-` 目录命名和 `Tld<Component>` React 导出；业务组件不使用该前缀。

## 4. TypeScript 与数据边界

- 保持 strict；禁止 `any`、非空断言、双重断言和无校验的外部数据断言。
- 所有具名函数、类方法、组件和公共 Hook 显式标注返回类型。
- 对象结构使用 `interface`；联合、映射、元组、泛型组合使用 `type`。
- API 响应先保持 `unknown`，校验后转换为 DTO/领域模型。
- DTO、领域模型、表单状态和 UI Props 不共用一个大类型。
- 普通 TypeScript 运算符可正常使用；涉及积分、计费或统计口径时，由所属领域模块明确单位、精度、舍入和测试，不预建金融十进制规则。
- 日期时间原生 API 只允许在 `shared/lib/time` 实现；业务模块通过公共入口使用。

## 5. Tailwind CSS 与响应式

Tailwind CSS v4 是默认样式层。Vite 通过 `@tailwindcss/vite` 接入，唯一全局入口为 `src/app/styles/index.css`。入口使用 `source("../..")` 将候选 class 扫描范围固定为 `src`，docs、scripts 和测试 fixture 不得进入 production CSS。

### 5.1 布局策略

- Mobile-first：无前缀规则覆盖手机 H5，`md` 覆盖平板，`xl` 覆盖 PC 和 Electron 宽屏。
- 基础实现目标视口为 390×844、768×1024、1440×900；它们用于约束响应式代码，不等同于 Codex 的人工视觉验收范围。
- Codex 只对 PC 端做人工视觉验收：优先使用任务或设计稿指定的桌面尺寸，未指定时使用 1440×900；特殊页面可增加 PC 超宽屏复测。390×844 H5 与 768×1024 平板的视觉、横竖屏和真机兼容由用户验收，交接时必须明确标为待用户验收，不得声称已通过。
- 优先使用流式宽度、`max-w-*`、Grid/Flex、`min-w-0`、`minmax()` 与必要的局部滚动。
- 交互目标在手机和平板上必须保持可点击；布局变化应来自断点和内容重排，不使用固定画布缩放。
- 禁止 px-to-rem/px-to-vw 自动转换、通过根字号整体缩放、以 UA 判断布局。
- Electron renderer 复用同一响应式实现；桌面专属能力不得改变 Web 布局契约。
- 跨页面重复文字使用全局语义字号阶梯：页面标题、区块标题、卡片标题、正文、标签、辅助文字、页签和强调操作分别选择对应 utility。默认值服务 H5，`md` 服务平板，`xl` 服务普通 PC，≥1920px 达到设计稿字号上限并停止放大；特殊展示数字或品牌首屏可在所属页面保留有上下限的局部规则。
- 响应式字号只能由 `src/app/styles/index.css` 的语义 token 或完整字面量断点 class 实现。禁止修改根字号、使用 `vw` 统一换算文字、整页 `transform: scale()`，也不得让所有文字共享同一个缩放比例。

App Shell 内新建常规列表/管理页，默认遵循[mainPage 版心与列表适配](./architecture.md#mainpage-版心与列表适配)：1280～1919px 左右统一各 16px，≥1920px 左右各 250px，两个 PC 区间均不保留页面级固定最大宽度。同类页面在同一视口和侧栏状态下内容边界必须对齐，宽屏卡片按可用宽度自动排布。设计稿提供视觉基准，不意味着固定版心或永久固定列数；特殊布局须有用户确认的不同需求再记录例外，不批量改变无关页面。

### 5.2 Class 规则

- Tailwind class 必须以完整字面量存在于 `className`，禁止 `bg-${color}` 之类的动态拼接。
- 条件 class 使用完整字符串分支；若组合复杂或多处重复，提取小组件或局部常量。
- 通用字号优先使用 `text-page-title`、`text-section-title`、`text-card-title`、`text-body`、`text-label`、`text-caption`、`text-tab-label` 与 `text-action-label`；只有排行榜数字、品牌展示等真实特殊视觉保留局部字号。
- 不创建全局业务 class，不用 `@apply` 复制一套组件系统；全局 CSS 仅维护 Tailwind 导入、主题 token、基础初始化和跨应用动效。
- 动态几何值允许使用 React `style`；静态视觉不得以内联样式绕过 token。
- 不再使用 Sass、CSS Modules、Stylelint 或自建布局 utility 层。
- `pnpm run lint:source-contracts` 会阻断动态 `className`、原始 Tailwind 调色板颜色、`dark:`/`light:` 业务 variant、内联原始颜色和额外 CSS/SCSS 文件。

### 5.3 主题

- `dark`、`light` 是当前完整主题，默认 `dark`。
- 原始色值只定义在 `src/app/styles/index.css` 的主题 token 中，并由 Tailwind `@theme inline` 映射为语义 utility。
- 组件只使用 `bg-canvas`、`text-primary`、`border-subtle` 等语义 class；不得硬编码 hex/rgb/hsl，也不得根据主题名写分支。
- 主题注册在 `shared/config/theme.ts`，应用与持久化经 `shared/theme`，存储键来自 `sharedConfig.storageKeys.theme`。
- 新增主题必须完整定义所有语义 token，当前阶段补齐中文名称即可；其他语言名称在翻译工作重新开启后同步。更新文档并按上述分工验证：Codex 验收 PC，平板/H5 交由用户验收。
- 主题切换动画通过 `useThemeTransition`；必须尊重 reduced-motion 并保留不支持 View Transition 时的直接切换。

## 6. 基础无障碍

基础无障碍是框架质量要求，不再禁止 a11y：

- 使用语义化元素，按钮和链接不以 `div` 冒充。
- 图标按钮提供可访问名称；抽屉/菜单暴露展开状态和控制关系。
- 所有交互可用键盘操作，并保留清晰的 `:focus-visible`。
- 所有可操作元素必须显式使用 `cursor-pointer`，不能只依赖浏览器默认光标；原生 `disabled`、`aria-disabled="true"` 或纯展示内容不使用 pointer，必要时使用 `disabled:cursor-not-allowed` 表达禁用态。
- 动画遵循 `prefers-reduced-motion`。
- 表单未来出现时必须有可关联标签和明确错误信息。

当前不承诺完整 WCAG 等级审计，也不预装专项 a11y 库；需要合规验收时单独立项。

## 7. 共享基础能力

- 请求：`shared/api`
- 环境、开关、默认值和存储键：`shared/config`
- 项目标识和固定 URL：`shared/constants`
- 主题：`shared/theme`
- i18n 基础设施：`shared/i18n`（当前翻译工作暂缓）
- 存储：`shared/lib/storage`
- 时间：`shared/lib/time`
- 剪贴板：`shared/lib/clipboard`
- 下载：`shared/lib/download`
- 动画：`shared/lib/animation`
- 通知：`shared/notification`

GSAP 与 `@gsap/react` 只能由 `shared/lib/animation` 装配和导出。React 组件优先使用带 `scope` 的 `useGSAP`，异步回调与事件处理器使用 `contextSafe`，并为 reduced-motion 提供直接结果；业务代码不得创建跨页面共享的全局时间线。

当前产品阶段保留 i18next 初始化、已有资源和语言切换能力，但新页面与新功能默认直接使用中文文案。除非需求明确重新开启多语言，不要为新文案新增 i18n key、不要制造占位英文翻译，也不因页面中出现中文字面量而拒绝交付。已有 i18n 消费者和资源不在普通页面任务中主动删除或重写。

业务代码禁止直接调用 LocalStorage、SessionStorage、原生 Clipboard API、`alert`、`confirm` 或 `prompt`。不要创建 `shared/utils`。

业务与页面代码也禁止直接调用 `fetch`；所有 HTTP 请求必须经 `shared/api`。renderer 源码禁止导入 Node.js 或 Electron 模块。

React Bits 作为候选动画与背景的源码来源，不作为整库运行时依赖。只在真实页面需求确认后选择 TypeScript + Tailwind 变体，将源码归入真实 FSD 所有者，并逐个审查转录授权、附加依赖、移动端成本、主题 token、类名契约、资源清理与 reduced-motion。复制后的代码是本项目源码，不保留上游目录结构，也不得绕过 `shared/lib/animation` 等已有公共边界。

## 8. 资源、Meta 与 PWA

- 业务资源就近放入所属模块 `assets/` 并通过静态 import 使用。
- `public/` 只放必须拥有固定 URL 的文件；它们会原样进入部署产物。
- 入口 Meta 只维护确认过的名称、描述和 robots；公开前保持 `noindex,nofollow,noarchive`。
- PWA 当前未启用。只能保留 `shared/lib/pwa` 的安装生命周期能力；禁止 manifest、Service Worker、缓存策略、插件或安装入口。

## 9. Electron

- `src/` 是 Web、H5 和 Electron renderer 的共同源码。
- 主进程保持 context isolation、sandbox、关闭 Node integration。
- 桌面 API 只通过具名 preload 方法和校验 sender 的 IPC 暴露；禁止通用 IPC 转发器。
- 新窗口与非可信导航默认拒绝。
- 移动端布局不得依赖 Electron，Electron 特性不得侵入业务模块。

## 10. 测试与交付

- 解析、状态转换、公共能力、兼容性降级和缺陷修复必须有就近单元测试。
- 纯页面组合和静态 Tailwind 布局通常不写单元测试，使用构建与人工视觉复测；Codex 只复测 PC，平板/H5 在交接中列为待用户验收。
- 默认运行：

```bash
pnpm run format:check
pnpm run test
pnpm run lint
pnpm run build
```

涉及 Electron 时再运行 `pnpm run desktop:build`。所有未执行验证必须在交接中说明。

## 11. 依赖与安装脚本

- 运行时依赖使用 `pnpm add <package>`，开发、构建或测试依赖使用 `pnpm add -D <package>`；同一任务同步 `package.json`、`pnpm-lock.yaml`、用途说明、相关文档和 CI。
- Prettier 是仅开发期使用的代码格式化器，不进入 Web 或 Electron 运行时产物，也不需要安装脚本白名单。
- 禁止手改 lockfile，禁止提交或忽略 `package-lock.json`、`yarn.lock`、`bun.lock*` 等第二套锁文件。
- `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 是依赖安装期脚本的唯一白名单。当前只允许 Vite 与 tsx 构建所需的 `esbuild`；没有实际依赖消费者的包不得保留在白名单中。
- 新增白名单前必须检查包的安装脚本、下载或原生编译行为、是否进入 Web/Electron 产物以及可替代方案，并在文档中记录包名、用途和风险。
- 审批只执行 `pnpm approve-builds <明确包名>`；禁止无包名的全量批准，也不得为消除安装警告而放宽白名单。
