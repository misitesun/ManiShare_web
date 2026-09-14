# AI 协作指南

本项目统一使用 Codex 进行 AI 代码协作。目标是让新上下文在没有聊天记录的情况下，仍能定位模块、遵守契约并自证结果。

## 1. 必读顺序

1. [AGENTS.md](../AGENTS.md)
2. [开发规范](./development-standards.md)
3. [TypeScript 规范](./typescript-standards.md)
4. [测试规范](./testing-standards.md)
5. [架构约定](./architecture.md)
6. 新页面或新能力先完成[需求就绪清单](./feature-delivery-checklist.md)
7. 任务涉及的模块 README、公共入口和测试
8. 匹配团队 Skill
9. 涉及浏览器、设备或 Electron 差异时阅读[兼容性契约](./compatibility.md)

团队 Skill：

| 任务 | Skill |
| --- | --- |
| 业务功能或缺陷 | `learning-web-feature-delivery` |
| 依赖、主题、路由、环境、共享能力、CI、Electron | `learning-web-cross-cutting-change` |
| 已有 diff 的只读审查 | `learning-web-change-review` |
| TSX 运行逻辑、Hook、状态、Effect、列表、加载、组件重构 | 叠加 `learning-web-react-engineering` |

新业务页面新增或改变路由时，同时使用 `learning-web-feature-delivery` 与 `learning-web-cross-cutting-change`，而不是二选一。跨切面 Skill 负责影响图和公共契约，功能 Skill 继续负责业务归属、数据边界和行为测试。

用户当前需求优先于仓库规则。若冲突会改变公共契约，必须同步修改规则，不能只在代码中绕过。

## 2. 实施流程

1. **定位**：确认 FSD 层、公共入口、影响文件和真实消费者；先判断代码能否留在页面真实所有者内，避免为页面私有组件预建 feature/widget。
2. **就绪**：按需求就绪清单确认范围、状态、多端行为和验收；只询问会实质改变方向且无法从事实来源发现的问题。
3. **实现**：保持最小状态和最小公共 API，不越层深导入；代码、脚本和配置统一 4 空格缩进，修改后运行 `pnpm run format`。
4. **记录**：同步模块 README、全局文档、ADR、环境或契约；只在任务明确涉及 i18n 时同步语言 key。
5. **验证**：运行 test、lint、build；涉及 Electron 再运行 desktop build。视觉验收只执行 PC 端，平板/H5 继续按响应式目标实现但交由用户验收。
6. **审查**：对公共变更使用只读 change review；按严重度修复 findings。
7. **交接**：说明改动、关键路径、验证、PC 视觉复测、运行时复测、假设与未决项；平板/H5 必须明确标为待用户验收。

同一工作区重叠文件只允许一个写入 Agent。Review Agent 只读，不代替 lint 或 CI。

## 3. 文档最低标准

接口接入、数据加载或带请求的组件复用任务先读[接口能力边界与缺失数据处理](./api-capability-boundaries.md)。实现前核对字段缺项和隐含副作用，缺失数据按该文档记录反馈；交接报告请求次数/来源证据、额外请求的需求与授权依据及未完成联调项。不得为使页面看似完整而自行增加补偿请求。

公共模块说明必须回答：

- 职责：解决什么，不解决什么；
- 入口：从哪里导入；
- 约束：依赖、数据、响应式或运行时边界；
- 扩展：新增能力时同步哪里；
- 验证：命令和必要人工复测。

公共能力、路由、存储键、语言 key、依赖、构建/CI、Tailwind 主题 token、响应式策略或 Electron bridge 改变时，文档与代码必须同一任务更新。

当前新页面和新功能使用中文字面量交付，不属于“语言 key 改变”。保留已有 i18n 基础设施，不得为了形式上的多语言对齐而制造占位翻译；后续用户明确开启多语言时，再将相关页面纳入 i18n 迁移与验收。

## 4. 当前基础设施

| 能力 | 唯一入口 |
| --- | --- |
| 技术选型与能力地图 | `docs/module-capabilities.md` |
| 路由 | `src/app/config/routes.ts`、`src/app/router/router.tsx` |
| 响应式壳层 | `src/widgets/app-layout` |
| Tailwind 与主题 token | `src/app/styles/index.css` |
| 主题 | `src/shared/config/theme.ts`、`src/shared/theme` |
| i18n | `src/shared/i18n` |
| HTTP | `src/shared/api` |
| 环境与存储键 | `src/shared/config` |
| 项目标识 | `src/shared/constants` |
| 存储 | `src/shared/lib/storage` |
| 时间 | `src/shared/lib/time` |
| 剪贴板 | `src/shared/lib/clipboard` |
| 下载 | `src/shared/lib/download` |
| 动画 | `src/shared/lib/animation` |
| 通知 | `src/shared/notification` |
| PWA 预留 | `src/shared/lib/pwa` |
| Electron | `electron/`、`electron-builder.yml` |
| 兼容性知识 | `docs/compatibility.md` |
| 代码格式 | `.editorconfig`、`prettier.config.mjs`、`.prettierignore` |

依赖变更必须先确认复用方案，再同步 `package.json`、`pnpm-lock.yaml`、用途说明和相关验证。依赖安装期脚本默认不执行；只有审查脚本用途与供应链风险后，才可用 `pnpm approve-builds <明确包名>` 将精确包名加入 `pnpm-workspace.yaml`，禁止全量批准。

## 5. AI 友好的实现

- 路径、模块名、配置键和验证命令写具体。
- Tailwind class 使用完整字面量；响应式差异使用 `md:`、`xl:`，不拼接 class。
- 主题只通过语义 token；业务组件不判断主题名。
- HTML 优先保持语义、键盘操作和可见焦点；不再以“禁止 a11y”为由删除基础质量。
- 写页面和共享组件时，按开发规范逐项检查可点击目标的 `cursor-pointer`，不能遗漏清空/关闭等内部操作、浏览器原生子控件和条件显示入口；PC 验收覆盖输入非空、展开及禁用/只读状态。输入区域保留文本光标，共享问题在组件 owner 修复。
- 不预建具体学习领域、全局状态、请求缓存、PWA、音频或录音封装。
- 不创建万能目录或重复资源。
- 轻页面默认内聚：页面私有 UI/model/assets 留在 page；独立业务动作进入 feature；跨页面大型组合才进入 widget。
- 文档示例必须和现有代码一致。
- 源代码、脚本和配置使用 4 个空格而不是 Tab；不手工争论 Prettier 已管理的换行和排版。
- FSD、公共入口、renderer 运行时和 Tailwind/主题的确定性契约由 `pnpm run lint:source-contracts` 阻断；Review 继续负责无法可靠机械判断的语义问题。

## 6. 验证

```bash
pnpm run format:check
pnpm run test
pnpm run lint
pnpm run build
pnpm run desktop:build
```

最后一项只在 Electron 边界受影响时要求。未运行或失败必须说明。
