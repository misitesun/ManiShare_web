# FSD app

- 职责：Provider、全局样式、URL 契约与 Client 页面装配。
- 入口：Next src/app 通过 router 下具名装配器组合业务。
- 约束：不反向导入 src/app；不保存领域规则；函数依赖在 Client 内创建。
- 扩展：分别维护 config、router 与 styles README。
- 验证：typegen、测试、lint、双环境构建与运行时冒烟。
