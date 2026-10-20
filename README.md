# English Learning Web Foundation

面向英语学习产品的 React 基础框架，renderer 同时支持 PC、平板、移动 H5，并可由 Electron 打包为桌面应用。当前提供基础壳层、公共能力、静态品牌登录落地页，以及玩家档案、推广收益和第一版练习演示等静态页面；真实认证和学习接口尚未接入。

> 产品品牌使用“漫奇说”；“English Learning” 仍是部分基础壳层中的 P0 工作名，后续可通过项目常量和 Electron 配置集中替换。

## 技术栈

- React 19 + TypeScript strict
- Next.js 16.3.6 App Router + Tailwind CSS 4（PostCSS）
- 静态导出，Web 与 Electron 共用 production 产物
- i18next
- GSAP + `@gsap/react`
- Electron 薄壳
- Feature-Sliced Design
- EditorConfig + Prettier 3（4 空格缩进，禁止 Tab）

## 已有基础能力

- Mobile-first App Shell：H5 抽屉、平板内容区、PC/Electron 常驻侧栏
- `dark` / `light` 两套完整语义主题，可继续扩展
- 中英文界面语言
- `/login` 独立品牌首屏，支持 PC、平板、H5、黑白主题与 React Bits 默认 Aurora 背景
- `/profile` 玩家资料页、`/profile/knowledge-gaps` 查漏补缺列表、`/profile/notes` 笔记本双视图静态列表、`/profile/learning-progress` 学习进度静态列表、`/profile/favorites` 我的收藏管理静态列表、`/profile/works` 我的作品管理静态列表、`/foreign-language-guide` 外语逆袭秘籍静态课程列表和 `/promotion/revenue` 推广收益静态页面
- `/practice/` 独立演示入口：本地模式与状态、完整设置弹窗复用、媒体基础播放、录音状态演示及事件驱动反馈封装
- `features/learning-settings` 提供七 Tab 编辑器和唯一偏好/背景图 Provider，独立设置页与练习同源
- 通用进度条、分段/下划线页签与触底分页状态组件
- API、存储、时间、剪贴板、下载、动画、通知基础边界
- Web staging/production 分离构建
- Electron 安全 preload/IPC 边界
- PWA 安装生命周期预留，但未启用 PWA

## 本地启动

要求 Node 22–24 与 pnpm `10.28.2`。

```bash
cp .env.development.example .env.development
pnpm install
pnpm run dev
```

## 验证

```bash
pnpm run format:check
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run build
pnpm run desktop:build
```

## Next 迁移与静态部署

唯一开发/路由/构建入口为 Next。业务六层在 `src/fsd`，`src/app` 只负责适配。`pnpm run build:production` 与 `pnpm run build:staging` 分别发布完整静态导出到 `dist/production` 与 `dist/staging`。所有页面保持 noindex；公开名单与正式域名尚未确认。

- [迁移进度与验收](docs/migration-status.md)
- [迁移决策](docs/decisions/0017-next-static-export.md)
- [静态部署契约](docs/static-deployment.md)

## 架构入口

- [开发规范](docs/development-standards.md)
- [TypeScript 规范](docs/typescript-standards.md)
- [测试规范](docs/testing-standards.md)
- [架构约定](docs/architecture.md)
- [技术选型与基础能力地图](docs/module-capabilities.md)
- [练习页开发文档](docs/practice-page-development.md)
- [单词游戏开发记录](docs/practice-word-games-development.md)
- [句子游戏开发记录](docs/practice-sentence-games-development.md)
- [练习页统一按键契约](docs/practice-keyboard-shortcuts.md)
- [练习页配色方案](docs/practice-page-color-scheme.md)
- [AI 协作指南](docs/ai-collaboration.md)
- [新页面与新能力需求就绪清单](docs/feature-delivery-checklist.md)
- [环境配置](docs/environment.md)
- [PWA 预留](docs/pwa.md)
- [Electron 说明](electron/README.md)

## 当前非目标

- 不接入真实学习接口、分页请求或已留空控件的业务动作。
- 不预建登录表单、注册或认证流程。
- 不启用 PWA、Service Worker 或离线缓存。
- 真实录音、评分、语音识别、课程朗读调度与 AI 教学服务留待后续；首版已包含音视频基础播放及录音状态演示。
- 不配置 Electron 签名、自动更新或真实后端认证。

练习入口为 `/practice/`，课程详情“开始学习”进入本地演示。最新能力、适配进度和单窗口开发流程见[开发文档当前入口](docs/practice-page-development.md#当前进度与单窗口开发入口2026-10-20)：统一快捷键、彩色键帽／双手与实输高亮、共用输入及弹窗已接；单词拼读静态 UI 已由用户于2026-10-20确认完成，当前代码见[归档快照](docs/checkpoints/2026-10-20-word-pronunciation-static-ui.md)，单词拼写已有12题本地比对与提交统计。正式学习接口、服务端判题、真实录音评分、课程音源和声音特效迁入仍待开发；技术WAV／MP4只验证播放器。当前暂停默认关闭，其他模式题面仍需逐项精修，平板／H5视觉与真机待用户验收，不把基础组合或历史专项视为全模式验收通过。
