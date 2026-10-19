# 时间展示

- 职责：集中提供带 locale 和默认时区的日期时间展示，以及累计用时的单调毫秒时钟。
- 入口：`index.ts` 导出时间函数与类型。
- 约束：业务和私有模块不得直接使用 `Date` 或 `Intl.DateTimeFormat`；内容或用户时区不同时必须显式传入 IANA 时区。
- 扩展：日期比较、倒计时和连续学习天数等能力须以真实需求独立设计，不在页面临时实现。
- 验证：新增时间行为时补就近测试，并运行 `pnpm run test && pnpm run lint && pnpm run build`。

getCurrentDayKey/getDayKey/isDayKey提供上海自然日YYYY-MM-DD及严格日期校验，供每日本地签到使用；时间仅在客户端挂载后或事件中读取，不进入首屏预渲染。day-key.test覆盖UTC16点换日、跨年及闰日。

`getMonotonicMilliseconds()`返回`performance.now()`的单调毫秒值，供实际经过时间测量使用，不作为日期、时间戳或可持久化数据。只在客户端挂载后或事件中调用，不在预渲染、模块初始化或render中读取。业务暂停、累计、格式化与任务清理由真实owner负责；练习页通过该入口计算用时，避免系统日期校准和定时回调延迟造成逐秒累加误差。`monotonic-time.test.ts`验证入口保留原始毫秒精度。
