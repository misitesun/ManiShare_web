# English Learning Web Foundation

面向英语学习产品的 React 基础框架，renderer 同时支持 PC、平板、移动 H5，并可由 Electron 打包为桌面应用。当前提供基础壳层、公共能力、静态品牌登录落地页，以及玩家档案与推广收益等静态页面；真实认证和学习接口尚未接入。

> 产品品牌使用“漫奇说”；“English Learning” 仍是部分基础壳层中的 P0 工作名，后续可通过项目常量和 Electron 配置集中替换。

## 技术栈

- React 19 + TypeScript strict
- Vite 8 + Tailwind CSS 4
- React Router
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
pnpm run test
pnpm run lint
pnpm run build
pnpm run desktop:build
```

## 架构入口

- [开发规范](docs/development-standards.md)
- [TypeScript 规范](docs/typescript-standards.md)
- [测试规范](docs/testing-standards.md)
- [架构约定](docs/architecture.md)
- [技术选型与基础能力地图](docs/module-capabilities.md)
- [AI 协作指南](docs/ai-collaboration.md)
- [新页面与新能力需求就绪清单](docs/feature-delivery-checklist.md)
- [环境配置](docs/environment.md)
- [PWA 预留](docs/pwa.md)
- [Electron 说明](electron/README.md)

## 当前非目标

- 不接入真实学习接口、分页请求或已留空控件的业务动作。
- 不预建登录表单、注册或认证流程。
- 不启用 PWA、Service Worker 或离线缓存。
- 不预建音频、录音、语音识别或 AI 教学能力。
- 不配置 Electron 签名、自动更新或真实后端认证。
