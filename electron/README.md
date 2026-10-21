# Electron 桌面薄壳

- 职责：为相同 Next production 静态导出提供窗口、englishlearning 自定义协议和具名 preload/IPC。
- 入口：main.ts、preload.cts；renderer-contract.ts 负责文件解析、MIME、缓存、CSP manifest 和信任 URL；media-byte-range.ts 负责本地 WAV／MP3／MP4 的单区间响应与按需字节读取。
- 约束：contextIsolation/sandbox 开启、nodeIntegration 关闭；renderer 不能导入 Node/Electron。标准且 secure 协议仅信任 englishlearning://app，无其他 host/port/credentials；开发只信任 runner 创建的 127.0.0.1 HTTP origin。will-navigate、will-redirect 与新窗口受限，IPC 校验 senderFrame。
- 扩展：新增桌面能力使用具名 preload API、参数校验和 sender 校验，不暴露任意 IPC/文件执行。
- 验证：desktop:build 编译 production+main；单元测试验证解析/安全边界，production runtime smoke 验证实际水合/CSP/RSC/导航。

2026-10-20欧路查词外链：`dictionary-navigation.ts`校验主窗口来源与目标，`main.ts`的原生新窗口处理只把可信renderer发起的`https://dict.eudic.net/dicts/en/<编码词条>`交给`shell.openExternal`（实现中不暴露shell对象）。Web与Electron使用同一原生`target="_blank"`词条链接；Electron始终返回deny，不创建第三方BrowserWindow。其他域名、协议、端口、凭据、非词条路径、查询／片段及表单内容保持拒绝，原will-navigate／will-redirect与sandbox／contextIsolation不变；不增加preload、IPC或renderer的Node导入。主进程安全策略独立于页面的词典地址构造，以免把产品地址配置等同于任意外站授权；更换供应商需同步两端策略及用例。已补策略用例但按用户要求未运行测试／构建或桌面实测，默认浏览器实际唤起仍待验收。

完整复制 dist/production（含 Next 的 txt 与分段 RSC、_next/static、public 和 CSP manifest）。首次加载 englishlearning://app/；目录映射 index.html，未知页面返回 status404 的404.html，资源/RSC未命中绝不返回HTML。txt RSC按实际导出命名返回text/x-component，query忽略；hash资源长期缓存，HTML/RSC/public短缓存。

CSP script-src self 加逐HTML SHA-256；启动校验manifest与HTML内容一致，响应时再次校验。不能用script unsafe-inline/unsafe-eval解决水合。新Next版本要重跑运行时冒烟，不能把资产SRI当作内联水合许可。

## 本地媒体进度定位

WAV／MP3／MP4分别使用`audio/wav`／`audio/mpeg`／`video/mp4`。只有成功解析的这三类文件的GET／HEAD进入`media-byte-range.ts`；Electron协议与Web静态预览共用相同规则，无Range为200，合法单区间为206，支持显式结束、开放结束和后缀。响应的`Accept-Ranges: bytes`、`Content-Range`、`Content-Length`与实际字节对应；非法、多段及不可满足区间为416／`bytes */total`／长度0。HEAD保留对应状态和长度头但无文件体。MP3是2026-10-20练习音效新增范围，已补源码断言，按用户要求未运行本轮测试或构建，真实解码与各端试听待验收。

该分支在路径 / 真实路径和资源404检查之后执行，不改变 HTML 完整性、RSC、既有页面 HEAD、导航限制、CSP 或 bridge。生产 CDN / 静态服务器也必须提供正确 MIME 和范围响应，不能只保证下载与顺序播放；能播放但不能定位进度是未通过基础播放器验收。

`media-byte-range.test.ts` 覆盖区间边界、字节、HEAD、416与截断读取；`renderer-contract.test.ts` 保留 MIME / 路径 / RSC / CSP回归验证。Web 与 `englishlearning` 的真实媒体进度 / `seekable` / 事件仍须用 production `runtime:smoke` 复测，Node 单测不能替代实际解码；平板 / H5 真机继续交由用户验收。详细来源和行为见[静态运行时契约](../docs/compatibility/next-static-runtime.md#本地-wav--mp4-单区间传输)。

开发：pnpm run desktop:dev 自动选可用本地端口、启动Next、HTTP就绪后启动Electron；超时、子进程失败与信号关闭都清理进程。不能先启动另一Next dev进程占用runner锁。构建：pnpm run desktop:build。打包：pnpm run desktop:package 或 :mac/:win，完整production与host纳入asar，release被忽略；不纳入.next/out等构建中间产物。

正式发布仍需产品图标/appId、macOS/Windows签名/notarization、API基址/认证、自动更新和平台安装包验收。当前没有Next Server、PWA、真实学习后端或任意renderer文件权限。Codex人工视觉仅PC，平板/H5与真机由用户验收。
