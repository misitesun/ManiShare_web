# 环境配置

唯一入口是 scripts/run-next.mjs。Next 的 NODE_ENV 仅 development/production；部署环境由 NEXT_PUBLIC_DEPLOY_ENV 区分。公开值不得包含密钥。

| 命令 | 环境 | 输出 |
| --- | --- | --- |
| pnpm run dev | development | dev server |
| pnpm run dev:staging | staging | dev server（NODE_ENV=development） |
| pnpm run build:staging | staging | dist/staging |
| pnpm run build:production | production | dist/production |
| pnpm run typecheck | production | next typegen + strict tsc |

Runner 合并 .env、.env.<target>，开发再合并 .env.local 与 .env.development.local。Shell 中显式管理变量优先；DEPLOY_ENV 不匹配即失败。CI 拒绝本地覆盖文件。每个管理变量（包括空值）均先显式注入子进程，避免 Next 自动 dotenv 把 staging 混入 production。引用展开只访问管理变量，未知引用/循环失败；APP metadata、语言、超时、API URL 与代理协议有校验。环境 runner 通过 `node_modules/.tmp/next-process.lock` 锁定单个 Next 进程，防止共享 .next/out 互相覆盖；锁记录进程号，持有者仍运行时拒绝第二个命令，异常退出后的失效锁自动恢复。无法识别持有者的旧式空锁必须先确认没有运行中的 Next 进程，再手动删除该锁。

| 变量 | 用途 | 浏览器可见 |
| --- | --- | --- |
| NEXT_PUBLIC_APP_NAME / NEXT_PUBLIC_APP_DESCRIPTION | Metadata | 是 |
| NEXT_PUBLIC_DEPLOY_ENV | development/staging/production | 是 |
| NEXT_PUBLIC_DEFAULT_LANGUAGE | 固定zh-CN，所有部署环境只使用中文，en-US及其他值会被runner拒绝 | 是 |
| NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_TIMEOUT | API 基础配置 | 是 |
| ROBOTS_POLICY | 当前必须 noindex,nofollow,noarchive | 否 |
| SITE_URL | 可选清洁 HTTPS origin；尚未确认 | 否 |
| API_PROXY_TARGET | 仅开发代理 | 否 |
| NEXT_DEV_ALLOWED_HOST | 可选的单个开发访问主机名或局域网 IP（无协议、端口）；用于 Next allowedDevOrigins | 否 |

默认仅允许 Next 内置的 localhost 开发来源。若通过局域网 IP 打开开发站点，先在被忽略的 `.env.development.local` 中设置 `NEXT_DEV_ALLOWED_HOST=<本机局域网 IP>`，再重启 `pnpm run dev`。只填写自己实际使用的主机，不使用通配符；此配置不进入 staging/production 构建。若页面能显示但点击无效，先在同一路径比较 localhost 与 IP，并检查开发资源的 403 响应。

首次开发复制 .env.development.example 为 .env.development；个人配置被忽略，迁移仅重命名变量并保留已有值。构建不会读取开发个人配置。新增 NEXT_PUBLIC 变量必须同步管理白名单和静态成员访问。当前公开路由名单为空，index 请求无论环境均失败，不能仅修改环境变量解锁索引；未来独立批准名单后同步 Metadata、canonical、robots 与 sitemap。

完整导出、缓存、失败保留、网关/API、旧资源与桌面发布见 [静态部署](static-deployment.md) 与 [Electron](../electron/README.md)。

构建期 scripts/register-static-assets.mjs 为 Node 枚举读取提供资源对象形状，先确认资源存在，不执行图片渲染；finalize-export 从各 owner 根 index 计算期望路由集合并与 Next prerender/HTML 集合比较。该 loader 不进入 renderer 或发布产物；实际图片加载仍由运行时冒烟验证。
