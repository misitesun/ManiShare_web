# ADR 0013：按组件采用 React Bits 视觉源码

- 状态：已采纳
- 日期：2026-09-10

## 背景

项目后续需要动画文字、背景和交互视觉，但逐个从底层渲染能力开始实现，会把大量时间消耗在参数探索与跨端调试上。React Bits 提供可预览、可调参且可复制源码的 React 动效组件，与当前 React、TypeScript 和 Tailwind 技术栈匹配。

## 决策

- React Bits 是候选源码与设计参考，不安装一个未被实际消费的整库依赖。
- 每次只在页面需求已确认时选择具体组件，优先采用 TypeScript + Tailwind 变体。
- 本仓库尚未初始化 shadcn registry；首个组件默认使用人工审查后的源码引入。出现多次稳定引入需求后，再独立评估 registry 配置。
- 引入前核对组件许可、实际依赖、DOM/Canvas 实现、移动端性能、浏览器兼容性和卸载清理。
- 引入后的源码归入真实 FSD 所有者，并改造为 strict TypeScript、语义主题 token、字面量 Tailwind class、可访问交互和 reduced-motion 降级。
- 组件若使用 GSAP，必须改为从 `shared/lib/animation` 导入；若要求其他运行时依赖，按依赖契约单独审查和安装。

## 影响

- 首个落地组件是 `pages/login/ui/Aurora.tsx`：使用 React Bits Aurora 默认的 OGL 全屏三角形、噪声波带与颜色渐变效果，运行时仅新增 `ogl`；项目补充主题、生命周期与多端运行边界，并仅翻转纵向 UV 使默认波带从页面底部向上展开，不再把 shader 改造成登录稿中的椭圆弧。源码保留上游版权与 MIT + Commons Clause 许可链接；允许集成进应用，但不得把组件本身单独或打包转售、再许可或再分发。
- OGL 不执行安装脚本；组件限制设备像素比、在 reduced-motion 下冻结首帧，并在卸载时清理观察器、动画帧、Program 与 WebGL context。
- 首页排行榜采用页面私有 `LightRays` 替代旧舞台背景位图，使用产品指定的顶部居中紫色单光束；颜色通过 `home-leaderboard-*` 主题 token 注入，舞台底色继承当前主题画布，并补充离屏/页面隐藏暂停、粗指针禁用跟随与 WebGL 失败保底。
- 后续需求应指定 React Bits 组件名或效果页链接；实现任务负责代码引入、FSD 归属、主题、响应式、依赖和验证。
- 上游预览只是视觉事实来源，不豁免本仓库的 lint、测试、多端与 Electron renderer 契约。
