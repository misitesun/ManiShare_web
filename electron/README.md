# Electron 桌面壳

## 职责

Electron 将同一套响应式 React renderer 打包为桌面应用。它只负责原生窗口、本地协议、导航安全与窄 IPC 边界，不复制页面，也不让业务组件访问 Node。

## 入口

- `main.ts`：创建窗口、提供 `englishlearning://` 本地 renderer 协议、限制导航并注册 IPC。
- `preload.cts`：通过 `contextBridge` 暴露具名 `window.learningDesktop` API。
- `electron-builder.yml`：工作名、appId、产物和平台目标。

当前 bridge 只提供 `window.learningDesktop.getAppVersion()` 作为边界证明，React 尚未消费。

## 约束

- `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false` 必须保留。
- production renderer 使用 `englishlearning://`，不使用 `file://` 或远程网站。
- 新窗口默认拒绝，非可信导航阻止。
- IPC handler 必须校验 sender，preload 不得暴露通用 `send`/`invoke`。
- renderer 最小布局宽度为 320px；桌面窗口允许缩至 360px，以复用并验证 H5 响应式壳层。

## 扩展

文件、媒体、通知、更新、窗口或系统交互出现真实需求时：

1. 阅读兼容性契约；
2. 定义最小具名 preload 方法、输入/输出和失败语义；
3. 在 main 注册对应 handler 并校验 sender；
4. 为外部输入补运行时校验；
5. 说明 Web/H5 回退；
6. 更新类型、文档与 Electron 验证。

正式品牌确认后同步修改 `electron-builder.yml`、协议、环境名称和图标；当前 English Learning 只是集中管理的工作名。

## 验证

```bash
pnpm run desktop:build
```

需要人工桌面复测时运行 Vite 后再运行 `pnpm run desktop:dev`，检查 360px 最小窗口、1440px 默认窗口、导航限制、主题和语言切换。
