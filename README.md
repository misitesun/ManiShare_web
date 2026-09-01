# English Learning Web Foundation

面向英语学习产品的 React 基础框架，renderer 同时支持 PC、平板、移动 H5，并可由 Electron 打包为桌面应用。当前只提供基础壳层和公共能力，不包含课程、练习、笔记或用户档案等具体页面。

> “English Learning” 是 P0 工作名。正式品牌确认后通过环境、项目常量和 Electron 配置集中替换。

## 技术栈

- React 19 + TypeScript strict
- Vite 8 + Tailwind CSS 4
- React Router
- i18next
- Electron 薄壳
- Feature-Sliced Design

## 已有基础能力

- Mobile-first App Shell：H5 抽屉、平板内容区、PC/Electron 常驻侧栏
- `dark` / `light` 两套完整语义主题，可继续扩展
- 中英文界面语言
- API、存储、时间、剪贴板、下载、通知基础边界
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
- [AI 协作指南](docs/ai-collaboration.md)
- [新页面与新能力需求就绪清单](docs/feature-delivery-checklist.md)
- [环境配置](docs/environment.md)
- [PWA 预留](docs/pwa.md)
- [Electron 说明](electron/README.md)

## 当前非目标

- 不实现具体学习业务页面和假数据。
- 不启用 PWA、Service Worker 或离线缓存。
- 不预建音频、录音、语音识别或 AI 教学能力。
- 不配置 Electron 签名、自动更新或真实后端认证。
