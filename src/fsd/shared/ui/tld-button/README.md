# TLD Button 按钮

- 邀请链接显式变体：size=mini为34px高、4px圆角、text-caption-tight的12/17px文字，variant=solid使用accent-green纯色。保留原生属性、禁用和可见焦点；原compact/medium及渐变默认值不变。

- 职责：提供跨页面的通用文字操作按钮，统一品牌主按钮、表面次按钮、尺寸、整行宽度、交互光标、禁用态和基础响应式表现。
- 入口：从 `src/fsd/shared/ui/tld-button` 导入 `TldButton`、`TldButtonProps`、`TldButtonSize` 和 `TldButtonVariant`。
- 约束：默认 `type="button"`；可操作状态固定使用 `cursor-pointer`，原生 `disabled` 状态改为 `cursor-not-allowed`；业务文案、点击状态和图标由调用方传入；不开放 `className` 覆盖公共外观，页面通过外层容器控制位置和宽度。图标按钮、导航页签、开关和链接保留各自语义，不强行套用本组件。
- 响应式：compact 文案使用全局标签字号，regular/large 使用全局卡片标题字号；1920px 保持原设计字号，H5 按语义阶梯缩小但不改变按钮点击高度。
- 扩展：新增视觉 variant 或尺寸前必须有真实消费者，并同步组件测试、所有消费者与本说明；提交中可通过原生 `disabled`、`aria-busy` 等属性表达，不在基础 UI 中持有业务状态。
- 验证：`TldButton.test.ts` 覆盖默认按钮类型和原生属性透传；运行 `pnpm run test && pnpm run lint && pnpm run build`，PC 核对主/次按钮、hover、focus 与 disabled；平板和 H5 的视觉及真机兼容由用户验收。

- 登录表单：新增 size=form（46px高、12px圆角、form-action 16/22）；variant=outline 提供透明/主题表面的渐变描边，当前由登录/注册切换入口消费。遮罩只裁出1px边框，不把渐变覆盖到整块内容；文案及交互仍由消费者控制。默认尺寸、primary/secondary与已有消费者不变。

- 渐变边框在mask简写的content-box层内声明exclude，避免Tailwind类排序使mask简写重置独立mask-composite。PC运行时核对实际合成属性及内容透明区域，不能仅检查class包含exclude。

slim/slim-tall分别为32/34px高、8px圆角、text-action-label-small固定14/20文案，用于紧凑弹窗。muted为语义button-muted表面/strong边框/primary文字；原outline/form及原默认消费者不变。

- 套餐尺寸：`size="plan"` 为50px高、12px圆角、action-label-compact字号（H5 16/22、md以上18/25），primary使用sRGB完整渐变，保留原生按钮及禁用语义；已有尺寸默认值不变。

- 紧凑套餐操作：`size="plan-compact"` 保持50px/r12，文字使用form-action 16/22，目前用于VIP联创介绍入口。`variant="subtle"` 为体验领取提供半透明表面与语义边框；disabled保留表面，只切换禁用边框/文字并使用原生disabled及非手型光标，不套整按钮半透明。业务领取状态归页面，其他尺寸及变体默认值不变。

- short尺寸为36px高、10px圆角、label-regular 14/20；soft外观为语义foreground的10%底/40%边框、hint文案。PK取消/等待显式选择，其他尺寸与variant默认保持。
