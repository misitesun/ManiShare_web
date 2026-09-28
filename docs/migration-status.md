# Next 迁移进度

基线：f5de715edc08fcc95dbf6fc13365a9e5df7f8b51；分支 codex/next-app-router-migration；依据 [迁移文档](迁移文档.md)。用户原文档修改已保留，没有远端操作。

| 阶段 | 状态与证据 |
| --- | --- |
| 0 技术门 | 通过：基线完整命令；Next16.3.6 PoC typegen/tsc/export；Web 与 Electron 实际水合、query、RSC 导航、位图/SVG、逐 HTML CSP hash |
| 1 FSD 机械移动 | 通过：format/test/lint、production/staging、Electron main 编译 |
| 2 Next 原子切换 | 本地通过：23 adapters；18固定+251动态=269业务HTML；完整RSC与资源集合校验；Vite/React Router默认入口与直接依赖已移除 |
| 3 Electron | 本地通过：实际host/preload/protocol、逐HTML CSP与digest、深链、RSC、IPC；desktop:dev启动/退出后端口、子进程和锁清理通过 |
| 4 SEO/部署 | 实现完成：全部noindex，robots全禁、空sitemap；公开名单为空，SITE_URL未确认；严格静态预览与部署契约已落地，正式部署待验收 |
| 5 最终复核 | 本地测试/类型/lint、双环境Web构建、Electron构建和production冒烟通过；干净CI的Electron安装脚本授权待用户批准，远端CI尚未执行 |

临时基线/PoC日志留在本机 /private/tmp，长期决定与复现入口记录在 [ADR0017](decisions/0017-next-static-export.md)。不把临时fixture或完整流水账纳入仓库。平板/H5视觉与真机、真实后端、正式桌面安装包/签名以及production网关/CDN由后续发布验收完成。

本地最终验证：`pnpm run test` 共132项通过（118 TypeScript/Electron +14脚本）；`pnpm run lint`、clean typegen/typecheck与构建后typecheck、`build:staging`、`desktop:build`通过。两个环境分别校验269个业务HTML，不把辅助404 HTML计入业务数。

`pnpm run runtime:smoke` 在Web HTTP与实际Electron协议中各访问23条契约的代表实例，共46次。验证真实水合事件、RSC请求/MIME、client导航无新增document、查询恢复/无关参数保留、显式父级返回、壳层跨页与history滚动、AI场景草稿/内部滚动与离开重置、主题刷新恢复、IPC、未知页面回首页，以及资源/RSC/API严格404。另在清空缓存并阻断HTTP/HTTPS后验证桌面深链冷加载和本地RSC导航。没有异常renderer控制台或网络失败；本机hidden Electron窗口偶有原生GPU mailbox stderr，不等同renderer错误，正式安装包需继续复测。

迁移前产物对照确认壳层滚动策略与聊天状态，回归已纳入runtime:smoke。PC1440×900人工检查了笔记查询/课程/章节导航、聊天与设置Portal、选项、Escape和焦点恢复；代表页面自动检查图片无破损、无横向溢出。未声称269页逐一人工视觉审查或平板/H5验收。

**CI授权待处理：** 当前onlyBuiltDependencies仍仅esbuild。新的xvfb生产运行时步骤需要干净安装时取得Electron二进制；已审查electron43.4.1安装脚本为下载指定版本、包内checksum校验和解压，但自动审批拒绝持久批准该依赖脚本，尚未改动白名单或绕过限制。用户明确批准仅electron后，按仓库规则执行`pnpm approve-builds electron`并同步依赖风险记录；在此之前不能宣称完整CI可在干净环境通过。
