# 0007：英语学习响应式基础框架

## 背景

仓库最初按桌面量化系统准备，包含 SCSS-only、最低 1024px、金融十进制运算与量化领域示例。产品方向已确认改为英语学习网站，需要支持 PC、平板、移动 H5，并在后期复用同一 renderer 打包 Electron。

## 决定

- 当前 P0 只建设基础框架，不实现课程、练习、笔记或玩家档案等具体页面。
- 使用 Tailwind CSS v4 与官方 Vite 插件，采用 mobile-first；默认覆盖 H5，`md` 覆盖平板，`xl` 覆盖 PC/Electron。
- 保留并明确 `dark`、`light` 两套完整主题。原始色值集中在全局主题 token，组件只消费 Tailwind 语义 utility。
- App Shell 负责响应式导航、内容容器、主题和界面语言入口；app 层通过 props 注入导航，widget 不反向依赖 app。
- 移除量化领域模型、量化页面、`decimal.js`、原始运算符禁令、Sass、CSS Modules 与 Stylelint 契约。
- 恢复基础无障碍质量：语义元素、可见焦点、可访问名称、键盘操作和 reduced-motion；完整 WCAG 审计仍需独立任务。
- Electron 保持安全薄壳并复用同一响应式 renderer；品牌使用集中管理的工作名 English Learning，正式品牌待确认。

## 取舍

Tailwind 提高页面组合效率并减少样式文件切换，但要求 class 使用完整字面量、主题颜色走语义 token，避免动态 class 和散落原始颜色。P0 的基础状态页只用于验证壳层，不代表产品信息架构。

## 验证

- 自动：`pnpm run test`、`pnpm run lint`、`pnpm run build`、`pnpm run desktop:build`。
- 人工视觉验收分工以当前开发规范为准：Codex 只验收 PC（未指定时为 1440×900），检查常驻侧栏、内容、黑白主题与默认中文展示；当前新页面的多语言翻译与切换验收暂缓。390×844 H5 和 768×1024 平板继续作为实现目标，其抽屉、溢出和真机视觉由用户验收。

## 后续

正式品牌、学习领域模型、首批路由、课程封面规范、浏览器版本矩阵、音频/录音能力和完整无障碍验收均需后续独立确认。
