# Electron 桌面薄壳

- 职责：为相同 Next production 静态导出提供窗口、englishlearning 自定义协议和具名 preload/IPC。
- 入口：main.ts、preload.cts；renderer-contract.ts 负责文件解析、MIME、缓存、CSP manifest 和信任 URL。
- 约束：contextIsolation/sandbox 开启、nodeIntegration 关闭；renderer 不能导入 Node/Electron。标准且 secure 协议仅信任 englishlearning://app，无其他 host/port/credentials；开发只信任 runner 创建的 127.0.0.1 HTTP origin。will-navigate、will-redirect 与新窗口受限，IPC 校验 senderFrame。
- 扩展：新增桌面能力使用具名 preload API、参数校验和 sender 校验，不暴露任意 IPC/文件执行。
- 验证：desktop:build 编译 production+main；单元测试验证解析/安全边界，production runtime smoke 验证实际水合/CSP/RSC/导航。

完整复制 dist/production（含 Next 的 txt 与分段 RSC、_next/static、public 和 CSP manifest）。首次加载 englishlearning://app/；目录映射 index.html，未知页面返回 status404 的404.html，资源/RSC未命中绝不返回HTML。txt RSC按实际导出命名返回text/x-component，query忽略；hash资源长期缓存，HTML/RSC/public短缓存。

CSP script-src self 加逐HTML SHA-256；启动校验manifest与HTML内容一致，响应时再次校验。不能用script unsafe-inline/unsafe-eval解决水合。新Next版本要重跑运行时冒烟，不能把资产SRI当作内联水合许可。

开发：pnpm run desktop:dev 自动选可用本地端口、启动Next、HTTP就绪后启动Electron；超时、子进程失败与信号关闭都清理进程。不能先启动另一Next dev进程占用runner锁。构建：pnpm run desktop:build。打包：pnpm run desktop:package 或 :mac/:win，完整production与host纳入asar，release被忽略；不纳入.next/out等构建中间产物。

正式发布仍需产品图标/appId、macOS/Windows签名/notarization、API基址/认证、自动更新和平台安装包验收。当前没有Next Server、PWA、真实学习后端或任意renderer文件权限。Codex人工视觉仅PC，平板/H5与真机由用户验收。
