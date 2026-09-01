# Tailwind 与全局主题

- 职责：导入 Tailwind CSS v4，定义 dark/light 原始主题值、语义 utility 映射、基础初始化和全局 reduced-motion/View Transition 规则。
- 入口：`index.css`，只能由 `src/main.tsx` 导入一次。
- 约束：Tailwind `source("../..")` 只扫描 `src` renderer 源码，避免 docs/scripts 测试样例污染 production CSS；原始颜色只在本文件的主题变量中出现；组件使用 Tailwind 语义 class，禁止动态拼接 class、硬编码颜色或新增全局业务样式。
- 扩展：新增主题先在 `shared/config/theme.ts` 注册，再补齐本文件所有 `--app-color-*` 值和两种语言名称；新增语义 token 必须有跨组件真实消费者。
- 验证：`pnpm run lint && pnpm run build`，人工检查 dark/light 与 390、768、1440 宽度。
