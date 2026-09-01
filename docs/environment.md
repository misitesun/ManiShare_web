# 环境配置

项目使用 Vite mode。已提交文件只包含公开默认值；真实 `.env.development` 被忽略。任何 `VITE_` 变量都会进入浏览器代码，禁止写密钥。

当前工作名为 English Learning，正式品牌确认前通过 `VITE_APP_NAME` 集中替换，不得散落在页面。

## Mode

只允许：

| mode | 用途 | 输出 |
| --- | --- | --- |
| `development` | Vite 开发服务器 | 不生成部署包 |
| `staging` | 预发布构建 | `dist/staging/` |
| `production` | 生产构建 | `dist/production/` |

`VITE_DEPLOY_ENV` 必须与 mode 一致。首次本地开发：

```bash
cp .env.development.example .env.development
pnpm run dev
```

保留个人 `.env.development`，模板变化时手工合并，不覆盖本地后端配置。

## 已支持变量

| 变量 | 作用 | 浏览器可见 |
| --- | --- | --- |
| `VITE_APP_NAME` | 工作产品名 | 是 |
| `VITE_APP_DESCRIPTION` | 入口描述 | 是 |
| `VITE_ROBOTS` | 搜索引擎策略 | 是 |
| `VITE_API_BASE_URL` | API 前缀或公开地址 | 是 |
| `VITE_API_TIMEOUT` | 请求超时毫秒 | 是 |
| `VITE_DEPLOY_ENV` | mode 标识 | 是 |
| `VITE_DEFAULT_LANGUAGE` | 首次界面语言 | 是 |
| `API_PROXY_TARGET` | 本地 Vite 代理目标 | 否 |

公开前所有环境保持 `noindex,nofollow,noarchive`。生产和预发布默认同源 `/api`；不要在 Electron 或前端硬编码真实服务器地址。

## 构建与缓存

JS、CSS、图片和字体输出到 `dist/<mode>/assets/`，文件名保持 `[name]-[hash]`。部署端应让 `index.html` 使用短缓存或 `no-cache`，让 `assets/*` 使用长期 `immutable`。

`public/` 文件不带 hash，只放固定 URL 资源。大型 PNG 的源码迁移只由开发者显式执行 `pnpm run assets:optimize`，build/CI 不修改源码。

## Electron

`pnpm run desktop:build` 生成 production renderer 与 `dist/electron/` 主进程；`pnpm run desktop:package` 输出到被忽略的 `release/`。

Electron 当前是薄壳，不配置签名、自动更新或后端认证。正式发布前必须单独确定：

- 产品正式名称、图标和 bundle/app ID；
- macOS/Windows 签名与 notarization；
- 自动更新策略；
- 桌面 API 基址、认证和网络策略；
- 对应平台 CI。

## 暂不预设

没有明确产品或部署条件前，不配置：

- Router basename 或 Vite `base`；
- legacy browser target；
- 生产 sourcemap；
- SSR、manifest 或手动分包；
- PWA、Service Worker 与缓存；
- 固定 host/port 或额外代理重写。
