# 架构约定

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
| `pages` | 路由入口与页面组合 | 可复用业务实现 |
| `widgets` | 跨页面的大型组合区块 | 应用级反向依赖 |
| `features` | 用户动作与业务流程 | 通用基础设施 |
| `entities` | 稳定领域对象 | 页面编排 |
| `shared` | 无业务语义的基础设施和公共 UI | 课程、练习等领域规则 |

例如未来“提交练习”应进入 `features/submit-exercise`，练习领域结构进入 `entities/exercise`，路由页面只组合它们。

## 路由

资源 ID 使用语义化路径参数：

```text
/courses/:courseId
/courses/:courseId/lessons/:lessonId
/profile/notes/:noteId
```

查询参数仅用于筛选、排序、分页和 Tab 等可恢复视图状态。路由表由 `src/app/config/routes.ts` 维护，路由装配在 `src/app/router/router.tsx`。

## App Shell 边界

`widgets/app-layout` 提供响应式壳层，但不知道 app 层导航配置。导航条目由 `app` 创建并以 props 注入，避免 widget 反向依赖 app。

壳层负责：

- PC 侧栏和顶部栏；
- 平板与 H5 抽屉导航；
- 内容滚动容器和 Safe Area；
- 主题、界面语言入口；
- Outlet 承载。

壳层不负责课程检索、会员状态、学习进度或任何具体业务。

## 响应式架构

Tailwind v4 使用 mobile-first：

| 范围 | 约定 |
| --- | --- |
| 默认 | 手机 H5；单列、抽屉导航、Safe Area |
| `md` | 平板；增加内边距、列数与信息密度 |
| `xl` | PC/Electron；常驻侧栏和宽屏内容区 |

组件拥有自身布局规则，页面只能组合。不要建立独立“mobile 页面”或复制两套 DOM；同一语义结构通过断点重排。只有真实交互语义不同且共享 DOM 会显著恶化时，才允许拆分视图。

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
| 用户动作 | `features/<feature>/model` |
| 稳定领域状态 | `entities/<entity>/model` |
| 组合布局交互 | 对应 `widgets/<widget>/model` 或 `ui` |
| 浏览器通用能力 | `shared/lib/<capability>` |
| 应用装配 | `app` 对应技术 segment |

禁止集中 `src/hooks`。公共 Hook 经所属模块 `index.ts` 导出。

## 目录粒度

一个目录只能描述一个概念，同一概念的实现、类型、测试、样式、说明和入口可以共存。出现第二个可独立演进概念时新建子目录。禁止万能 `utils`、`types`、`services`。

## shared/lib 边界

当前稳定能力为：

| 能力 | 公共入口 |
| --- | --- |
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
- `className` 使用完整字面量分支，组件不使用原始 Tailwind 调色板、主题 variant 或内联原始颜色；
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
