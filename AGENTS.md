# AI 协作者入口

修改本仓库前，依次阅读：

1. [开发规范](./docs/development-standards.md)
2. [TypeScript 规范](./docs/typescript-standards.md)
3. [测试规范](./docs/testing-standards.md)
4. [架构约定](./docs/architecture.md)
5. [AI 协作指南](./docs/ai-collaboration.md)

## 核心架构

- 遵守 Feature-Sliced Design（FSD）的 `app → pages → widgets → features → entities → shared` 单向依赖。
- 业务 slice 只经根目录 `index.ts` 暴露公共 API；`app` 与 `shared` 按技术职责组织，不按业务 slice 划分。
- 目录只承载一个可命名概念，禁止建立 `hooks`、`utils`、`components`、`services`、`types` 等万能收纳目录。
- 轻页面默认采用轻量 FSD：只服务一个页面、会随页面一起删除的 UI、Hook、状态和资源留在 `pages/<page>` 内；独立用户业务进入 `features`，跨页面大型组合才进入 `widgets`，不得按文件大小机械拆层。
- 有公共边界的 slice、`app` 技术 segment、共享能力和共享 UI 必须维护同目录 `README.md`，说明职责、入口、约束、扩展与验证。
- 业务资源跟随所属模块进入 `assets/`；出现第二个真实消费者时才提升到共同允许依赖的最低层。禁止全局 `src/assets` 收纳目录和未引用资源。

## AI 工作流

项目只使用 Codex 进行 AI 代码协作。开始代码改动前，从 `.agents/skills/` 读取匹配流程：

- 业务功能：`learning-web-feature-delivery`
- 公共契约、路由、主题、环境、依赖、CI 或 Electron：`learning-web-cross-cutting-change`
- 已有 diff 的只读审查：`learning-web-change-review`
- TSX 运行逻辑、Hook、状态、Effect、列表、客户端加载或组件重构：同时读取 `learning-web-react-engineering`

新业务页面同时涉及业务交付与路由时，必须同时使用 `learning-web-feature-delivery` 和 `learning-web-cross-cutting-change`：后者负责影响图与公共契约，前者继续负责业务归属、数据边界和行为测试；不得因切换 Skill 丢弃另一侧检查。新页面或新能力开始前先完成[需求就绪清单](./docs/feature-delivery-checklist.md)。

Skill 编排任务，但不替代本文件、详细文档、lint、测试或 CI。涉及浏览器、Electron renderer、设备或运行时差异时，先阅读[兼容性契约索引](./docs/compatibility.md)。

确认会反复影响未来实现选择的问题，按 [AI Skills 与 Agent 协作](./docs/ai-skills.md#从问题到团队知识)沉淀为 lint/测试、模块说明、兼容性契约、ADR 或待办；猜测和完整调试流水账不得伪装成团队规则。

## 工具链与类型

- 包管理器唯一使用 pnpm `10.28.2`。所有项目命令必须使用 `pnpm` 或 `pnpm run`；禁止 npm、yarn、npx、bun。
- 源代码、脚本和配置文件统一使用 4 个空格缩进，禁止 Tab；根目录 `.editorconfig` 和 Prettier 配置是可执行契约。修改后使用 `pnpm run format`，`pnpm run lint` 会通过 `format:check` 阻断格式偏差。
- 新增运行时依赖使用 `pnpm add`，开发依赖使用 `pnpm add -D`；同一任务同步更新 `package.json`、`pnpm-lock.yaml`、文档与 CI。
- 依赖安装脚本默认不执行；只有 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 中经过审查的精确包名可以运行。新增白名单必须记录脚本用途和供应链风险，只能执行 `pnpm approve-builds <明确包名>`，禁止全量批准。
- TypeScript 使用 strict 模式：禁止 `any`、非空断言和无校验的外部数据断言；所有具名函数与类方法必须标注返回类型。
- 对象契约使用 `interface`，联合、映射和泛型组合使用 `type`；DTO、领域模型与 UI Props 分层定义。
- LocalStorage 与 SessionStorage 只能通过 `shared/lib/storage` 访问；日期时间原生 API 只在 `shared/lib/time` 实现。
- 复制文本只通过 `shared/lib/clipboard`；用户通知只通过 `shared/notification`。
- GSAP 与 React 动画 Hook 只通过 `shared/lib/animation` 导入；动画必须限定作用域、完成清理并尊重 reduced-motion。

## 样式、主题与响应式

- Tailwind CSS v4 是页面与组件样式的默认实现；全局入口固定为 `src/app/styles/index.css`。
- 采用 mobile-first：默认规则覆盖手机 H5，`md` 覆盖平板，`xl` 覆盖 PC/桌面宽屏。使用流式容器、Grid/Flex、`min-w-0` 和必要的局部滚动。
- PC、平板和 H5 都是实现兼容目标；Codex 的人工视觉验收只覆盖 PC（优先使用任务指定的桌面设计尺寸，未指定时使用 1440×900）。平板与 H5 的视觉和真机兼容由用户验收，交接时必须标为待用户验收，不得声称已通过。
- 禁止 px-to-rem/px-to-vw 自动转换、修改根字号整体缩放，以及用固定画布缩放冒充响应式。
- Tailwind class 必须以完整字面量出现在源码中，禁止字符串拼接动态生成；复杂重复组合先提取组件，不建立全局业务 class。
- 跨页面重复的页面标题、区块标题、卡片标题、正文、标签、页签与操作文案必须优先使用 `src/app/styles/index.css` 提供的语义字号 utility。字号以 H5 为默认，`md` / `xl` 逐级调整，≥1920px 达到设计稿上限；不得通过根字号或整页缩放实现。
- 颜色只能通过 `src/app/styles/index.css` 的语义主题 token 暴露给 Tailwind；组件不得硬编码颜色，也不得按 `dark`/`light` 写业务分支。
- 当前主题固定注册 `dark` 与 `light`，默认 dark。主题应用和持久化只经 `shared/theme`；新增主题必须补齐完整 token，当前阶段只需中文名称，其他语言在翻译工作重新开启后补齐。
- 保留 `shared/i18n`、已有语言资源和切换基础设施，但当前版本暂不开展多语言翻译。新页面和新功能默认直接展示中文，不强制新增语言 key 或同步 `en-US`；未经后续明确需求，不得以翻译完整性阻塞页面交付。
- 基础无障碍属于框架质量要求：优先语义 HTML、可见焦点、可访问名称、键盘可操作性和 reduced-motion。当前不承诺完整 WCAG 审计；新增第三方 a11y 库或专项验收仍需明确任务。
- 所有真实可操作内容，包括按钮、链接、开关、展开项、可点击卡片和图标入口，必须显式使用 Tailwind `cursor-pointer`。纯展示或禁用内容不得用 pointer 光标伪装为可操作。
- `pnpm run lint:source-contracts` 阻断 FSD 反向依赖、跨模块深层导入、renderer 的 Node/Electron 导入、直接 `fetch`、动态 Tailwind class、原始颜色和额外组件样式文件；不得通过改写检查脚本绕过真实违规。

## Web 与 Electron

- React renderer 同时服务 PC、平板、移动 H5 和 Electron；不得在业务组件直接依赖 Node/Electron API。
- Electron 保持 `contextIsolation`、sandbox、关闭 renderer Node integration，桌面能力只经具名 preload API 与校验 sender 的 IPC 暴露。
- Web 构建输出隔离到 `dist/staging`、`dist/production`，Electron 主进程输出 `dist/electron`，安装包输出被忽略的 `release/`。
- PWA 当前未启用；禁止添加 manifest、Service Worker、缓存逻辑或 PWA 插件，直到独立任务确认。
- Vite mode 仅允许 `development`、`staging`、`production`；development 只用于开发服务器。

## 验证与变更同步

- 公式、解析、状态转换、公共能力和缺陷修复必须补同目录单元测试；纯页面组合或静态布局通常不测。
- 新增或改变公共能力、路由、存储键、语言 key、依赖、构建/CI、主题 token、响应式规则或 Electron bridge，必须同步更新文档。
- 默认完成 `pnpm run test && pnpm run lint && pnpm run build`；涉及 Electron 再运行 `pnpm run desktop:build`。
- 不修改无关代码，不虚构学习业务规则，不擅自执行远端 Git 操作。
