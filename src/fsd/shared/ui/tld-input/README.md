# TldInput

- 职责：带可访问 label 和可选 icon 的原生输入框；透传原生输入属性，但不接受 className/style 或原生数值 size；size 使用组件语义尺寸。焦点使用 brand 边框和淡阴影，支持 disabled 与 reduced-motion。
- 入口：`index.ts` 导出组件和 Props。
- 约束：无业务状态、不访问接口或存储，使用语义主题色，兼容 dark/light；尺寸由父级布局控制。
- 扩展：新增外观需求先扩展语义 Props，不开放任意样式覆盖。
- hover 与 focus-within 统一使用绿色 `brand` 边框；聚焦保留淡阴影。`size` 为 medium（40px，默认）或 large（46px）；`trailingAction` 支持尾部操作，调用方负责名称、键盘、光标和禁用状态。容器使用 div，显式 label 关联原生输入，避免按钮嵌套在 label 内；可传入 id，否则自动生成。
- 光标：输入区使用文本光标；支持原生搜索清空按钮的浏览器通过 `::-webkit-search-cancel-button` 显式使用手型，禁用/只读时覆盖。未提供原生清空按钮的浏览器不额外生成操作。PC 手动验证输入非空时清空按钮的悬停与清空行为。
- 验证：同目录渲染契约测试；页面浏览器核对键盘和受控状态，平板/H5由用户验收。运行 test/lint/build。

- 玻璃表单外观：appearance=glass 为登录/注册真实消费者提供主题化半透明表面、内阴影与14/20的 field-label 字号；size=large仍为46px。保留 label、原生属性、错误关联和 trailingAction；默认外观及顶部搜索、查漏补缺、PK消费者保持原契约。禁用时输入及尾部操作由原生disabled控制，外观不产生请求或状态。颜色和阴影由全局 login-input-* token 管理。

- glass内边距11px与1px边框合计12px，使20px图标与文字间10px间距按设计落位；默认输入的内边距不变。

- pill外观显式提供40px高的圆角搜索框，空字符串受控value时图标与占位文字居中，聚焦或非空时输入区域展开；仍保留label、disabled/readOnly、字段关联与原生清空光标。PK房号搜索为当前消费者，default/glass不改变。
