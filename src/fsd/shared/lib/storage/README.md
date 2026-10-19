# Web Storage

完整设置能力使用已登记的 learningPreferences（english-learning-preferences-v1）。shared 将其作为 unknown 技术数据容器，不反向导入页面模型；features/learning-settings 校验版本、字段、选项、颜色和快捷键。异常由调用方显示，不通过全站清空恢复。

- 职责：提供受 `StorageSchema` 约束的 LocalStorage 访问。
- 入口：`index.ts` 导出 `storage` 及其类型、用于生成首屏偏好读取脚本的 `storageBootstrapRead`。
- 约束：这是项目唯一 Storage 入口；键名先登记到 `sharedConfig.storageKeys`，禁止 `localStorage.clear()`。首页定位提示通过布尔键 `locationPromptConfirmed` 记录提示确认状态，不存储位置或权限结果。
- 扩展：新增键时同步配置、Schema、行为测试和文档；业务模块不得直连浏览器 Storage API。
- 验证：变更读写语义时补就近测试，并运行 `pnpm run test && pnpm run lint && pnpm run build`。

bootstrap 只接受已登记的 `AppStorageKey`，兼容 JSON 与早期原始字符串值，调用方仍负责校验领域值；不能用它绕过业务模块禁止直连 Storage 的约束。

dailyCheckin/homeClubPrompt的StorageSchema为unknown，由owner校验版本/日期/累计数/布尔值；clearAppStorage按登记键清理，两项随清除项目数据恢复初始流程，定位原键不变。

practiceBackgroundImage为新登记unknown容器，由features/learning-settings唯一所有者保存经校验和压缩的本机背景图，供独立设置页、预览及练习会话消费；偏好与图片分开写，移除图片不重置learningPreferences。clearAppStorage会按登记键一并清理图片；配额和访问异常继续抛给owner，由owner保留旧图并反馈。storage.test验证独立键、移除隔离及清理范围。

完整设置提取不新增存储键、版本、同步协议或直接 Storage 访问。偏好写失败保留本次内存值并提示刷新恢复失败；图片保存失败保留旧图。两个键不是原子事务，部分保存结果由 feature 可观察反馈，shared 不尝试回滚其他业务数据。

自制练习技术媒体是固定同源 public 文件，不写入 learningPreferences 或 practiceBackgroundImage，不使用 Storage 缓存音视频，也不把技术片段登记为用户课程内容。

practiceToolbarOptions（english-learning-practice-toolbar-options-v1）为独立unknown容器，version 1及family:mode字段白名单由pages/practice/model/practice-toolbar-preferences.ts校验；shared不导入该页面。页面在挂载后恢复，初次预渲染不读写缓存，只在有效用户修改时保存；读写异常仍抛给owner，写失败保留本页内存与待保存作用域并明确反馈。保存时读回最新容器并合并本页待存作用域，保留其他模式值，不增加storage事件或跨标签同步协议。

仅移除工具栏缓存使用storage.remove(practiceToolbarOptions)，不清空全局偏好、主题或第三方数据。clearAppStorage按已登记项目键包含新缓存，禁止localStorage.clear()；相邻测试覆盖新键读写、单独移除、项目清理范围和异常向owner传播。坏值和未知字段由页面逐项忽略，不因恢复失败清除其他键；原先没有工具栏缓存，无旧值迁移。
