# 基础状态页

- 职责：保留 P0 基础验收页面实现，用于验证 Tailwind、主题与 GSAP 交互；当前不接入产品路由，也不承载英语学习业务。i18n 基础仍由 `shared/i18n` 保留，本页不承担当前阶段的多语言验收。
- 入口：`index.ts` 导出 `FoundationPage`；若以后需要恢复内部验收入口，由 app router 懒加载其公共入口。
- 约束：页面只组合 `play-celebration` 演示 feature，不持有动画实现；不得堆放课程、练习、笔记或用户档案占位实现，真实业务必须建立独立 page 与下层 slice；能力卡标题和正文使用全局响应式语义字号，品牌展示标题保留页面局部断点。
- 扩展：恢复内部验收路由时，在 `app/config/routes.ts` 与 router 中新增明确路径；产品首页由 `pages/home` 独立维护。
- 验证：`pnpm run lint && pnpm run build`；Codex 仅在 PC（未指定时 1440×900）人工检查布局、双角动画、重复播放与 reduced-motion，390×844 H5 与 768×1024 平板由用户验收。
