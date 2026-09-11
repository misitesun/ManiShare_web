# Tailwind 与全局主题

- 职责：导入 Tailwind CSS v4，定义 dark/light 原始主题值、响应式语义字号、语义 utility 映射、基础初始化、共享渐变文字 keyframe 和全局 reduced-motion/View Transition 规则。
- 入口：`index.css`，只能由 `src/main.tsx` 导入一次。
- 约束：Tailwind `source("../..")` 只扫描 `src` renderer 源码，避免 docs/scripts 测试样例污染 production CSS；原始颜色只在本文件的主题变量中出现；组件使用 Tailwind 语义 class，禁止动态拼接 class、硬编码颜色或新增全局业务样式。字号阶梯默认服务 H5，`md` / `xl` 覆盖平板与普通 PC，≥1920px 达到设计稿上限；禁止根字号、`vw` 或整页缩放。
- 扩展：新增主题先在 `shared/config/theme.ts` 注册，再补齐本文件所有 `--app-color-*`、`--app-background-*` 与图标 filter 值和中文名称；dark 的 canvas/surface/brand 基准同时服务 Figma App Shell，`accent-green/cyan/blue/orange/magenta` 提供课程标签和状态标识使用的跨主题分类强调色，`danger-surface` 与 `progress-track` 分别承载状态底色和进度轨道，`icon-contrast`、`--app-filter-shell-icon` 与 `--app-filter-dialog-icon` 让设计稿 SVG 在 light 下保持可辨识且不跨组件语义复用，`tooltip` / `tooltip-text` 为两套主题提供一致的深色文字气泡，`dialog-*` 用于对话框遮罩和表面渐变，`login-*` 是登录落地页语义 token，`membership-*` 的文字色与 `membership-*` 渐变背景分别服务跨页面会员标签，`home-*` 服务首页排行榜，其中 WebGL 光束色由 dark/light 完整声明。`3xl` 固定为 1800px，用于宽屏界面增强；首页在 1440px 起保持原三列位置，视口达到 1920px 时才恢复固定列宽。字号提供页面标题、区块标题、卡片标题、正文、标签、辅助文字、页签和强调操作八个角色，新增角色必须有真实消费者。
- 验证：`pnpm run lint && pnpm run build`；Codex 仅在 PC 设计尺寸（未指定时 1440×900）人工检查 dark/light，390×844 H5 与 768×1024 平板视觉由用户验收。
