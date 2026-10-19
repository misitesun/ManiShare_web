# 静态部署契约

- 完整发布 dist/staging 或 dist/production，包括所有 HTML、RSC txt/分段文件、_next/static、public、robots/sitemap 与 CSP manifest。不能只复制首页。
- 所有路径带 trailing slash。已知无尾斜杠页面 308 到规范 URL（保留 query）；目录映射 index.html。未知页面返回真正 404.html，客户端延续默认回首页。缺失 JS/CSS/RSC/图片返回非 HTML 的 404。
- HTML、RSC 与无 hash 的 public 文件使用 max-age=0,must-revalidate；_next/static 使用 max-age=31536000,immutable。404 no-store。RSC Content-Type=text/x-component，query 不改变文件映射。
- CSP script-src 只允许 self 和各 HTML 的 SHA-256 内联脚本 hash；无 script unsafe-inline/unsafe-eval。发布 .csp-manifest.json 对应的响应头，HTML 与 manifest 同版；预览/Electron 校验内容 digest。style-src 保留既有 unsafe-inline，以支持 React 动态样式。
- 构建先验证 29 契约、24+251=275 业务 HTML 集合与完整 RSC/资源（包含 `/settings/`、`/pk/`、`/competition/`、`/pk/matching/`、`/pk/loading/`、`/practice/`），再临时目录复制与可回滚 rename 发布；任何构建/验证失败保留原环境。两个环境互不删除。该本地替换有极短目录切换窗口；正式 CDN/网关须版本目录与原子指针切换。
- 部署 API 代理/网关与页面静态站分开配置；禁止把 /api 未命中回退为首页。Electron 默认 /api 仍未指向真实服务器，正式接入前须确认公开 API 基址与认证。
- CDN 不能同时清掉旧 _next/static 内容 hash；保留旧客户端生命周期所需旧资源，禁止跨版混用 HTML/RSC/CSP。回滚必须整版回滚。
- 当前所有页面 noindex/nofollow/noarchive；robots Disallow:/，sitemap 为空，未输出 canonical。公开名单与 SITE_URL 未确认，当前 index 请求构建失败。未来按批准名单逐页调整，私有页面不得进入 sitemap。
- 本地 pnpm run preview / preview:staging 是严格静态验收服务器，不使用 next start。Production 真实网关/CDN、正式包与签名尚需部署验收。

- 登录新增 view 查询视图，仍仅导出 /login/index.html 及其既有RSC；query不参与文件映射。五种登录和三种注册均为前端视图，没有真实认证端点、验证码/微信授权或会话写入。

- `/practice/` 是独立布局的本地演示入口，仍只导出 `/practice/index.html` 与对应 RSC；`demo` / `mode` 查询不新增导出路径，不代表正式课程或章节 ID。练习内容、录音状态和结果为前端演示；播放器已接入自行生成的技术 WAV/MP4，页面明确非课程音视频；正式业务媒体和音色缺项仍单列，没有后台接口、真实录音评分或学习记录提交。本轮 275 份为构建器要求的目标集合，生产构建和 1920px 精确视觉验收结果按实际执行记录，不由文档计数代替。

- 固定 URL 技术样例随 public 完整发布：`/practice-demo/technical-tone.wav` 以 `audio/wav` 提供，`/practice-demo/technical-video.mp4` 以 `video/mp4` 提供；两者按无 hash 的 public 缓存策略处理。严格预览/Electron 解析器已登记这两种 MIME，正式网关/CDN 需保持相同类型及资源404行为。媒体来源、内容和格式见 [public/practice-demo/README.md](../public/practice-demo/README.md)；两个样例仅验证播放封装，不用于课程或音色替代。此次不放宽 CSP、不添加 blob/data 媒体来源或 Electron bridge；实际播放与静音视频不含音轨的验收范围须分别记录。
