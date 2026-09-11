# ADR 0016：四空格代码格式化

## 背景

仓库原先没有 `.editorconfig`、Prettier 配置或全仓格式检查脚本，文档和四个团队 Skill 正文也没有规定 2 空格缩进。但 `scripts/validate-ai-skills.mjs` 的元数据正则硬编码了 2 空格，形成了仅适用于 Skill YAML 的隐式可执行约束。其他现有代码则因编辑器与人工习惯混合使用 2 空格和 4 空格，`src/pages/home/ui/HomePage.tsx` 的已确认自动格式是 4 空格。

## 决策

- 源代码、脚本和配置文件统一使用 4 个空格缩进，禁止 Tab。
- 根目录 `.editorconfig` 提供编辑器契约，`prettier.config.mjs` 提供机械格式化，`.prettierignore` 定义不应机械改写的内容。
- `pnpm run format` 写入格式，`pnpm run format:check` 只检查；`pnpm run lint` 和现有 CI 通过后者阻断格式偏差。
- Skill UI 元数据的现有字段与引用校验保持不变，仅将子级缩进的可执行契约从 2 空格同步为 4 空格。
- Markdown、生成的 `pnpm-lock.yaml` 和静态资源排除在机械格式化外，避免与代码缩进无关的大规模 diff。

## 取舍

首次执行会产生一次性的全仓机械格式 diff，但之后编辑器、本地命令与 CI 共享同一结果，不再依赖个人偏好。Prettier 是开发依赖，不进入 Web 或 Electron 运行时。

## 验证

```bash
pnpm run format
pnpm run format:check
pnpm run lint
```
