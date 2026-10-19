# 动画能力

- 职责：集中装配 GSAP、React `useGSAP`、Lottie SVG 与 SiriWave 播放器，确保浏览器播放器只在挂载后加载，并统一实例清理与预览活动观察。
- 入口：从 `shared/lib/animation` 导入 `gsap` 与 `useGSAP`，禁止业务代码直接导入 `gsap` 或 `@gsap/react`。
- 原版动画入口：`createLottiePlayback(container,{loadData,loop,speed,...})`返回局部实例的play/pause/stop/still/destroy；异步加载取消后不写DOM，原始JSON按实例深拷贝。`LottiePreview`提供循环预览，`useAnimationActivity`观察可见区域、文档可见性和reduced-motion；不可见预览暂停，reduced-motion只显示静帧。业务事件门控、资源和播放位置由真实业务owner管理。
- 曲线频谱入口：`loadSiriWave()`按需加载构造器；`SiriWaveInstance`仅供实例类型。调用方负责ResizeObserver、主题变化及dispose，不允许形成全局声纹循环。
- 依赖：按2026-10-19用户确认采用原参考项目版本`lottie-web@5.13.0`、`siriwave@2.4.0`（均MIT）。GSAP不能解析原始Lottie数据或替代SiriWave原版曲线，因此增加这两个精确依赖；只从本入口导入。Lottie使用不含表达式执行器的light SVG版本，素材不含表达式、外部图片或字体，不放宽CSP。两包均没有安装期生命周期脚本，未增加`onlyBuiltDependencies`条目；CI继续frozen-lockfile安装，并运行独立`settings-effects:smoke`。
- 约束：组件使用带 `scope` 的 `useGSAP` 管理选择器范围和卸载清理；延迟回调与事件处理器使用 `contextSafe`；所有非必要动画必须为 `prefers-reduced-motion` 提供直接到达最终状态的分支。动画目标和时间线由真实业务模块拥有，不在本目录集中编排。
- 扩展：新增 ScrollTrigger 等 GSAP 插件时，先确认真实消费者、Web/Electron 兼容性和 reduced-motion 行为，再在本边界注册并同步文档与验证。
- 验证：运行 `pnpm run test && pnpm run lint && pnpm run build`，只有 Electron 边界受影响时再运行 `pnpm run desktop:build`；Codex 仅在 PC 目标视口进行动画交互与视觉验收，H5/平板的视觉和真机兼容由用户验收，Electron 运行时复测按实际影响范围执行。
