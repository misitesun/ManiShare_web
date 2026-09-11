# 编辑课程集合

- 职责：为“我的作品”和“我的收藏”提供一致的浏览/编辑、整卡多选、取消编辑和本地批量删除状态；不负责两个页面的数据、筛选、分页或删除文案。
- 入口：从 `src/features/edit-course-collection` 导入编辑操作区、整卡选择覆盖层与纯状态转换函数。
- 约束：默认为无选中项的浏览态；只有编辑态允许选择；“取消”仅清空本次选择并保留已删除记录；确认删除后返回浏览态。选择覆盖层使整张卡片可点击且保留原生按钮、键盘和 `aria-pressed` 语义；编辑操作使用全局 action-label 响应式语义字号。
- 扩展：接入真实删除请求时，由各业务页面传入提交结果并补充 loading/error/重试；不将页面数据或服务端契约下沉到本 feature。
- 验证：`model/course-collection-editing.test.ts` 覆盖进入编辑、多选、取消、删除及已删项保护；运行 `pnpm run test && pnpm run lint && pnpm run build`，并在消费页面完成 PC 交互验收。
