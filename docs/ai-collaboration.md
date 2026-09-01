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

1. **定位**：确认 FSD 层、公共入口、影响文件和真实消费者。
2. **就绪**：按需求就绪清单确认范围、状态、多端行为和验收；只询问会实质改变方向且无法从事实来源发现的问题。
3. **实现**：保持最小状态和最小公共 API，不越层深导入。
4. **记录**：同步模块 README、全局文档、ADR、语言 key、环境或契约。
5. **验证**：运行 test、lint、build；涉及 Electron 再运行 desktop build。
6. **审查**：对公共变更使用只读 change review；按严重度修复 findings。
7. **交接**：说明改动、关键路径、验证、视口/运行时复测、假设与未决项。

同一工作区重叠文件只允许一个写入 Agent。Review Agent 只读，不代替 lint 或 CI。

## 3. 文档最低标准

公共模块说明必须回答：

- 职责：解决什么，不解决什么；
- 入口：从哪里导入；
- 约束：依赖、数据、响应式或运行时边界；
- 扩展：新增能力时同步哪里；
- 验证：命令和必要人工复测。

公共能力、路由、存储键、语言 key、依赖、构建/CI、Tailwind 主题 token、响应式策略或 Electron bridge 改变时，文档与代码必须同一任务更新。

## 4. 当前基础设施

| 能力 | 唯一入口 |
| --- | --- |
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
| 通知 | `src/shared/notification` |
| PWA 预留 | `src/shared/lib/pwa` |
| Electron | `electron/`、`electron-builder.yml` |
| 兼容性知识 | `docs/compatibility.md` |

## 5. AI 友好的实现

- 路径、模块名、配置键和验证命令写具体。
- Tailwind class 使用完整字面量；响应式差异使用 `md:`、`xl:`，不拼接 class。
- 主题只通过语义 token；业务组件不判断主题名。
- HTML 优先保持语义、键盘操作和可见焦点；不再以“禁止 a11y”为由删除基础质量。
- 不预建具体学习领域、全局状态、请求缓存、PWA、音频或录音封装。
- 不创建万能目录或重复资源。
- 文档示例必须和现有代码一致。
- FSD、公共入口、renderer 运行时和 Tailwind/主题的确定性契约由 `pnpm run lint:source-contracts` 阻断；Review 继续负责无法可靠机械判断的语义问题。

## 6. 验证

```bash
pnpm run test
pnpm run lint
pnpm run build
pnpm run desktop:build
```

最后一项只在 Electron 边界受影响时要求。未运行或失败必须说明。
