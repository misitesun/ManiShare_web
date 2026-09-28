# 播放庆祝动画

- 职责：提供用户主动触发的双角彩色卡片庆祝动画，用于验证 GSAP React 动画边界；不承载学习领域规则。
- 入口：`index.ts` 导出 `PlayCelebration`，由需要庆祝反馈的页面组合。
- 约束：粒子层不接收指针事件且不进入可访问树；动画只从 `shared/lib/animation` 导入，作用域限制在组件内，重复播放先清理上一轮；reduced-motion 下点击不产生运动；触发按钮使用全局 label 语义字号并显式展示 pointer 光标。
- 扩展：只有确认新的庆祝场景后才增加可配置文案、密度或轨迹；不可把页面布局或全局时间线移入本 feature。
- 验证：运行 `pnpm run test && pnpm run lint && pnpm run build`；Codex 仅在 PC（未指定时 1440×900）人工检查按钮位置、双角喷射、重复点击和 reduced-motion，390×844 H5 与 768×1024 平板由用户验收。
