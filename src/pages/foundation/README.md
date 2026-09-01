# 基础状态页

- 职责：作为 P0 唯一路由，验证响应式 App Shell、Tailwind、主题和 i18n 已正确装配；不承载英语学习业务。
- 入口：`index.ts` 导出 `FoundationPage`，仅由 app router 懒加载。
- 约束：不得向此页堆放课程、练习、笔记或用户档案占位实现；真实业务必须建立独立 page 与下层 slice。
- 扩展：首个业务路由确认后，在 `app/config/routes.ts` 与 router 中新增语义路径，并保留或移除此状态页。
- 验证：`pnpm run lint && pnpm run build`，人工检查 390×844、768×1024、1440×900。
