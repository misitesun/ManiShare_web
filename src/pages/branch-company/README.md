# 分公司页面

## 职责

- 承载左侧导航底部钻石入口对应的分公司页面。
- 展示待结算、可提现概览，以及奖励明细和提现明细页签。
- 奖励明细使用页面内静态数据模拟分批加载；提现明细复用 `widgets/withdrawal-records`，与推广收益页面保持同一记录、状态和交互。

## 公共入口

- `index.ts` 仅导出 `BranchCompanyPage`。
- 应用路由为 `/branch-company`，入口由 `app/config/navigation.ts` 的底部导航配置注入 `AppLayout`。

## 约束

- 该页面不发起接口请求，也不推导真实结算或提现业务规则。
- 奖励分页状态沿用 `shared/ui/tld-pagination-status`；提现表格和分页由 `widgets/withdrawal-records` 统一提供，后续接入接口时需要补齐 loading、error 和重试状态。
- 页面内设计资源放在 `assets/`，当前结算与钱包图标来自 Figma 节点 `1096:33946`。
- 提现按钮当前仅完成静态 UI，不扩展未授权的提现交互。

## 响应式

- H5 默认单列并允许表格局部横向滚动。
- 平板保持流式布局；桌面宽屏在 1920px 设计尺寸下采用该页面设计给出的 254px 内容边距。
- PC 由 Codex 对照设计稿验证，平板与 H5 留给用户验收。

## 验证

- `pnpm run test`
- `pnpm run lint`
- `pnpm run build`
- PC 检查奖励与提现页签、提现二维码弹窗和审核说明 Tooltip；平板与 H5 留给用户验收。
