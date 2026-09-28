# 项目待办

## 仓库治理

- [ ] Next迁移干净CI：明确批准仅electron安装脚本后更新白名单与供应链风险记录，再执行远端CI；本地production runtime:smoke已通过，详见[迁移进度](migration-status.md)。
- [ ] 为 GitHub `main` 默认分支创建 Ruleset，并要求 CI 状态检查。
- [ ] 团队评审职责稳定后配置 CODEOWNERS 和审批策略。

## 产品待确认

- [ ] 正式产品名、Logo、favicon、Electron appId/productName 和签名主体。
- [ ] 英语学习信息架构：课程、课时、练习、笔记、档案的领域边界与首批路由。
- [ ] 设计系统最终字号、间距、插画风格和课程封面产出流程。
- [ ] 目标浏览器、最低 iOS/Android 版本与平板横竖屏验收矩阵。

## 出现真实需求后再建立

- [ ] URL 查询状态：筛选、排序、分页或 Tab 需要与地址栏同步时再建立 `shared/lib/query-state`。
- [ ] 音频播放/录音/语音识别：明确浏览器权限、格式、超时、后台恢复和 Electron 差异后独立设计。
- [ ] 通知 UI：在 `shared/notification` 内替换原生回退，不改变调用侧入口。
- [ ] 完整业务 E2E：迁移已提供 `pnpm run runtime:smoke` 覆盖生产 Web/Electron 路由、水合、查询、主题、IPC 与 RSC；真实接口/学习业务流程在需求明确后补充，不把迁移冒烟等同完整业务验收。
- [ ] PWA：按 [PWA 预留能力](pwa.md) 完成安全与更新策略后启用。
