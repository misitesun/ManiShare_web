# 登录落地页

- 职责：呈现漫奇说登录前的品牌首屏、静态登录入口与贴底向上扩展的 React Bits Aurora 流动光带；文字与布局继续对齐 Figma `1:28`。
- 入口：`index.ts` 导出 `LoginPage`，由 app router 在 `/login` 懒加载。
- 约束：页面私有 UI、资源与 `Aurora` WebGL 视觉留在本 slice；极光源码改编自 React Bits Aurora，使用 OGL 并仅翻转纵向 UV 使波带从页面底部向上展开，不形成共享背景组件；本轮不实现表单、认证或跳转，不使用 App Shell。
- 降级：WebGL 2 不可用时保留主题画布与完整文案；`prefers-reduced-motion: reduce` 下只渲染静态首帧；主题、尺寸、监听器、动画帧和 WebGL context 必须随页面同步或清理。Shader 的 `uResolution` 必须使用 drawing buffer 尺寸，不能在限制 DPR 后继续传 CSS 尺寸，否则高像素密度设备会让波带几何和颜色停靠点整体偏移。极光几何以 `1920:1080` 设计比例为基准并贴底等比缩放；窗口比例变化时只裁切超出的纵向内容，不得拉伸波带。
- 扩展：真实登录动作与后端契约确认后再建立 feature；只有出现第二个真实消费者并确认视觉契约稳定后，才重新评估极光组件的归属。
- 验证：运行 `pnpm run test && pnpm run lint && pnpm run build`；Codex 仅在 PC 设计尺寸（当前为 1920×1080，可补充 1440×900）人工检查 dark/light 布局、动画、静态降级和控制台错误，390×844 H5 与 768×1024 平板由用户验收。
