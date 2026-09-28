# TLD 列表分页状态

- 职责：统一列表底部的自动加载哨兵以及加载中、无更多数据、失败重试反馈。
- 入口：`index.ts` 导出 `TldPaginationStatus`、Props、状态值类型和纯状态判断函数。
- 约束：仅 `idle` 通过 `IntersectionObserver` 在列表底部进入视口时触发下一页；监听随状态和卸载清理。`error` 与自动加载复用同一个回调，确保重试的是当前失败页；组件不拥有页码、请求或领域数据；反馈文案使用全局 label 语义字号。
- 扩展：业务列表负责显式提供 `idle/loading/exhausted/error`；若未来出现已登记的兼容性要求，再按 `docs/compatibility.md` 增加可观察降级，当前不引入滚动监听或第三方依赖。
- 验证：`pagination-status.test.ts` 覆盖自动加载条件与文案映射；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 端人工验证触底加载，平板/H5 视觉和真机兼容由用户验收。
