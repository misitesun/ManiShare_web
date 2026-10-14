# Web Storage

设置页登记 learningPreferences（english-learning-preferences-v1）。shared 将其作为 unknown 技术数据容器，不反向导入页面模型；pages/settings 校验版本、字段、选项、颜色和快捷键。异常由调用方显示，不通过全站清空恢复。

- 职责：提供受 `StorageSchema` 约束的 LocalStorage 访问。
- 入口：`index.ts` 导出 `storage` 及其类型、用于生成首屏偏好读取脚本的 `storageBootstrapRead`。
- 约束：这是项目唯一 Storage 入口；键名先登记到 `sharedConfig.storageKeys`，禁止 `localStorage.clear()`。首页定位提示通过布尔键 `locationPromptConfirmed` 记录提示确认状态，不存储位置或权限结果。
- 扩展：新增键时同步配置、Schema、行为测试和文档；业务模块不得直连浏览器 Storage API。
- 验证：变更读写语义时补就近测试，并运行 `pnpm run test && pnpm run lint && pnpm run build`。

bootstrap 只接受已登记的 `AppStorageKey`，兼容 JSON 与早期原始字符串值，调用方仍负责校验领域值；不能用它绕过业务模块禁止直连 Storage 的约束。

dailyCheckin/homeClubPrompt的StorageSchema为unknown，由owner校验版本/日期/累计数/布尔值；clearAppStorage按登记键清理，两项随清除项目数据恢复初始流程，定位原键不变。
