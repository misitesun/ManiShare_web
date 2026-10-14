# 提现明细区块

- `WithdrawalRecordTable appearance="contrasted"` 用于推广奖励：表头body-tight的16/22px、正文label的14/20px及0.01em字距，content-strong文字、row-alternate交替行；审核徽标使用review-*语义色、12/17px文字，银行卡/开户行20px行高。默认appearance不变，分公司仍用默认值。字段、二维码、Tooltip及分页完全共用，不能复制第二套表格。`ui/WithdrawalRecordTable.test.ts`验证两种外观的状态、字段、收款码入口及首次无弹窗。

- 职责：为推广收益和分公司页面统一展示提现明细表格、静态分页演示、审核状态、收款码预览和审核说明 Tooltip。
- 入口：根 `index.ts` 导出 `WithdrawalRecordTable`、`withdrawalRecordPages` 与 `useWithdrawalRecordPagination`；调用页只负责页签和 panel 编排。
- 约束：当前记录为 Figma 静态演示数据，不代表真实提现或审核规则，也不发起接口请求；二维码只在用户点击后通过共享 `TldDialog` 放大展示。
- 响应式：桌面表格最小宽度为 1212px，表头 54px、数据行 52px；分页哨兵位于当前视口下方，滚动到列表底部才加载下一页；平板与 H5 在表格区局部横向滚动，不缩放列内容。
- 扩展：接入真实接口时由确认后的提现业务能力提供 DTO 校验、分页请求和错误重试；不得由两个页面分别维护表格副本。
- 验证：`model/pagination.test.ts` 覆盖分页边界；运行 test/lint/build，并检查两处页面的分页、二维码弹窗、Tooltip 与窄屏横向滚动。
