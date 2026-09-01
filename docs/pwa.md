# PWA 预留能力

当前项目未启用 PWA：没有 manifest、PWA 图标、Service Worker、离线缓存、安装入口或插件。

`shared/lib/pwa` 仅保留安装生命周期 Hook，应用启动时监听 `beforeinstallprompt` 和 `appinstalled`，不会注册 Service Worker、创建缓存或显示入口。

## 公共入口

从 `shared/lib/pwa` 导入 `usePwaInstall`：

```tsx
const { canInstall, isInstalled, supportsInstall, install } = usePwaInstall()
```

持久化只能通过 `shared/lib/storage`。业务代码不得直接监听或模拟安装事件。

## 启用前置条件

未来启用必须作为独立任务同时确定：

1. manifest、正式品牌图标与入口 Meta；
2. Service Worker 更新、缓存范围和回滚；
3. 登录态、学习数据、音频和 API 响应的缓存安全；
4. 安装入口、浏览器不支持时的交互；
5. iOS、Android、桌面浏览器真实 HTTPS 验收。

在这些条件确认前，禁止添加 PWA 插件、manifest、Service Worker、缓存策略或安装入口。
