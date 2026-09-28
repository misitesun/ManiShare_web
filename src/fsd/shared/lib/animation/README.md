# 动画能力

- 职责：集中装配 GSAP 与官方 React `useGSAP` Hook，确保插件只注册一次并为业务动画提供稳定入口。
- 入口：从 `shared/lib/animation` 导入 `gsap` 与 `useGSAP`，禁止业务代码直接导入 `gsap` 或 `@gsap/react`。
- 约束：组件使用带 `scope` 的 `useGSAP` 管理选择器范围和卸载清理；延迟回调与事件处理器使用 `contextSafe`；所有非必要动画必须为 `prefers-reduced-motion` 提供直接到达最终状态的分支。动画目标和时间线由真实业务模块拥有，不在本目录集中编排。
- 扩展：新增 ScrollTrigger 等 GSAP 插件时，先确认真实消费者、Web/Electron 兼容性和 reduced-motion 行为，再在本边界注册并同步文档与验证。
- 验证：运行 `pnpm run test && pnpm run lint && pnpm run build`，只有 Electron 边界受影响时再运行 `pnpm run desktop:build`；Codex 仅在 PC 目标视口进行动画交互与视觉验收，H5/平板的视觉和真机兼容由用户验收，Electron 运行时复测按实际影响范围执行。
