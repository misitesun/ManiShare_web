# ADR 0009：通过共享边界接入 GSAP React 动画

- 状态：已采纳
- 日期：2026-09-07

## 背景

后续英语学习页面需要更丰富的交互动效，同时同一 React renderer 要运行在 H5、平板、PC 与 Electron。直接在各业务模块分别导入和注册 GSAP，会让插件注册、React 生命周期清理、reduced-motion 降级与扩展方式逐渐分叉。

## 决策

- 运行时依赖使用 `gsap` 与官方 `@gsap/react`。
- `src/shared/lib/animation` 是唯一公共入口，并在模块装载时集中注册 `useGSAP`。
- React 动画默认使用带 `scope` 的 `useGSAP`，依赖变化时按实际语义选择 `revertOnUpdate`；Hook 外创建动画的回调必须使用 `contextSafe` 或显式清理。
- 业务模块拥有自己的目标、时间线与交互语义；共享边界不预建全局动画控制器，也不让 App Shell 在没有产品需求时产生动画。
- 非必要动画必须响应 `prefers-reduced-motion` 并直接呈现最终状态。出现经过复现的浏览器、设备或 Electron 差异后，再按兼容性流程登记独立契约。
- 源码契约检查阻止业务代码直接导入 `gsap`、`gsap/*` 或 `@gsap/react`。

## 影响

- 后续动画拥有一致的 React 清理与导入方式。
- 基础包增加 GSAP 运行时体积；只有真实需要动画的模块导入公共入口，避免在 App 根部无条件装载。
- ScrollTrigger 等附加插件不在本次预注册；出现真实消费者时再评估、注册和验证。
