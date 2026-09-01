# 0008：组合式交付流程与源码契约校验

## 背景

真实业务页面通常同时包含业务 slice、React renderer 和路由公共契约。若遇到路由后从业务 Skill 完全切换到跨切面 Skill，会遗漏数据边界、领域归属或行为测试。另一方面，FSD、根公共入口、Tailwind 字面量和语义主题只依赖文档与人工审查时，会随着页面数量增长产生确定性漂移。

## 决定

- 新业务页面同时使用 `learning-web-feature-delivery` 与 `learning-web-cross-cutting-change`：跨切面 Skill 负责影响图和公共契约，业务 Skill 保留业务归属、外部数据和行为测试检查；涉及 React renderer 时继续叠加 `learning-web-react-engineering`。
- 新页面或新能力开始前使用 `docs/feature-delivery-checklist.md` 明确范围、状态、多端行为和验收，只有会改变实现方向的未决项才阻断实施。
- 新增 `pnpm run lint:source-contracts`，使用仓库已有 TypeScript 解析器检查源码，不增加新的运行时或构建依赖。
- 校验阻断 FSD 反向依赖、业务同层 slice 互相依赖、跨公共模块深层导入、renderer 导入 Node/Electron、业务直接调用 `fetch`、动态 `className`、原始 Tailwind 颜色、主题 variant、内联原始颜色和额外 CSS/SCSS 文件。
- Tailwind 入口显式使用 `source("../..")`，只扫描 `src` renderer。Tailwind 将候选文件视为纯文本；测试 fixture、脚本或文档中的违规 utility 若进入自动扫描范围，会污染 production CSS，因此源码契约同时阻断扫描范围被放宽。
- 校验器使用独立 fixture 测试验证有效与违规路径，并由现有 `lint`、`test` 和 CI 统一执行。

## 边界与后果

源码校验负责可机械判断的仓库契约，不替代 TypeScript、Tailwind/Vite 构建、只读 Review 或真实视口复测。当前内部导入只使用相对路径；未来如引入路径别名，必须在同一任务扩展解析规则和测试。新的公共例外必须先修改架构契约并提供真实消费者，不允许通过宽泛忽略绕过。
