# AI Skills 与 Agent 协作

团队 Skill 将可重复任务流程版本化在 `.agents/skills/`。Markdown 定义长期规则，Skill 编排读取与实施步骤，lint/测试/CI 提供可执行证据。

```text
需求 → 实现 Skill → test/lint/build → 只读 Review Skill → 修复 → 交接
```

## 规范来源

| 层 | 位置 | 职责 |
| --- | --- | --- |
| 入口规则 | `AGENTS.md` | 高频强制边界 |
| 详细知识 | `docs/`、模块 README、ADR | 背景、契约与取舍 |
| 工作流 | `.agents/skills/` | 一类任务的步骤 |
| 执行检查 | lint、测试、构建、CI | 阻断机械违规 |

用户当前需求优先；冲突必须显式修改规则并记录影响。

## 团队 Skill

| Skill | 使用场景 |
| --- | --- |
| `learning-web-feature-delivery` | 页面、业务能力和局部缺陷 |
| `learning-web-cross-cutting-change` | 路由、主题、Tailwind、环境、依赖、共享能力、CI、Electron |
| `learning-web-change-review` | 对已有变更做只读独立审查 |
| `learning-web-react-engineering` | TSX、Hook、状态、Effect、列表、加载和渲染性能判断 |

新业务页面同时新增或修改路由时，`learning-web-feature-delivery` 与 `learning-web-cross-cutting-change` 必须组合使用；前者不因路由变化而停止。涉及 renderer 行为时再叠加 React Skill。

每个 Skill 目录包含同名 `SKILL.md` 和 `agents/openai.yaml`，由 `pnpm run lint:ai-skills` 验证。校验同时保证四个核心 Skill 完整存在、治理文档引用有效、组合 Skill 的相互路由未丢失。团队源码只保留在仓库，不复制到个人规则中。

React Skill 参考 Vercel Labs 的 React best practices，并按 Vite 客户端、FSD、Tailwind 与多端 renderer 约束裁剪；不自动引入 Next.js、RSC、全局状态、缓存库或组件库。

## Agent 边界

- 实现 Agent 可修改任务范围。
- Review Agent 只读，输出按严重度排序的 findings。
- 重叠文件同一时间只有一个写入 Agent。
- 并行工作必须拆成不重叠模块或独立 worktree。

交接至少包含改动范围、验证结果、未运行项、假设和待人工决策。

## 从问题到团队知识

只有“已经证实且会改变未来实现选择”的经验才沉淀：

| 问题性质 | 位置 |
| --- | --- |
| 可机械判断 | lint 或就近测试 |
| 模块私有边界 | 模块 README / 公共注释 |
| 浏览器、设备、Electron 差异 | 兼容性契约 |
| 跨模块长期取舍 | ADR |
| 有价值但当前不做 | todo |

Skill 负责触发判断，不能取代这些知识。未经证实的猜测、一次性日志和完整调试流水账不进入团队规则。
