# 语言切换器

- 职责：为已有 i18n 基础设施提供受控的中文/英文切换 UI；它不代表当前新页面已进入多语言交付范围。
- 入口：`index.ts` 导出 `LanguageSwitcher`。
- 约束：可选语言来自 `shared/i18n`；组件使用字面量 Tailwind class，不自行读写 Storage 或维护另一套语言列表。当前新页面可始终显示中文，不得因切换器存在而虚构翻译。
- 扩展：新增语言或将新页面纳入翻译必须先获得产品确认，再在 i18n 配置和目标语言资源中完整登记。
- 验证：`pnpm run test && pnpm run lint && pnpm run build`。
