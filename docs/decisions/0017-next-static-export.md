# 0017 Next App Router 与共享静态导出

2026-09-28；替代 0001 的 SPA 资源回退、0005 的 Vite 框架范围，以及 0006/0007/0008 中的框架接入细节。历史 ADR 保留当时事实。

采用 Next 16.3.6、React 19.2.8、Node 22.23.1、Turbopack、Tailwind PostCSS 4.3.3。Next App Router 是唯一框架入口；output export 与 trailingSlash true。六层移到 src/fsd，src/app 为薄适配层。Electron 使用相同完整静态导出，不运行 Next Server。每个 Client 路由独立入口，Server props 只传 ID，函数在 FSD app 装配；公共 index 不使用 use client，动态枚举器与业务模型共用 owner。

阶段 0 隔离 PoC 已实际完成 clean typegen/tsc/build、两实例导出、混合 barrel、函数注入、位图/SVG、查询恢复与 PC 浏览器导航。Electron 43.4.1 自定义协议中原 script-src self 阻断水合，生成逐 HTML SHA-256 hash 后水合事件、RSC Client 导航通过，console error 为零且仅首次 document load。选定 HTML/hash manifest，与资产 SRI 不混为一谈。实际 RSC 包含 index.txt、__next._tree.txt、__next._full.txt 与 __next.<segment>.__PAGE__.txt；映射忽略 query，text/x-component，完整复制。

源基线 f5de715edc08fcc95dbf6fc13365a9e5df7f8b51 在独立命令中 test/lint/production/staging/desktop 全通过。阶段 1 只机械搬迁，同样通过。真实产物对照：Vite 笔记课程跳转、history back/forward、query replace 均保留壳层 120px；Next 默认导航改为 80px，因此现有导航显式 scroll:false 保留原策略，不改变 Next 默认预取。AI 切换 scene/mentor 原本保留草稿与内部滚动，采用 page-owned、chat layout-scoped session；离开聊天后重置。静态导出外的未知 ID 与路径使用真正 404 文档并保留客户端回首页，不能在发布后生成新动态实例。

后果：需显式环境 runner、完整导出校验、严格资源 404、每页 CSP manifest、原子版本发布与 Server/Client 治理。默认 noindex，公开路由与正式 SITE_URL 未确认。PC 与 Electron production 运行时冒烟用已安装 Electron 的 hidden sandbox BrowserWindow 重复执行；CI Linux 用 xvfb，Cua 用于人工 PC 视觉核对。运行时状态见迁移进度；平板/H5 与正式包、CDN/网关不因静态检查自动通过。
