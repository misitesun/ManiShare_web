# TLD 下拉选择

- 职责：受控单选下拉菜单，提供圆角触发器、浮层与已选项背景；通过语义 token 适配深浅主题。
- 入口：`TldSelect`、`TldSelectProps`、`TldSelectOption` 从根 `index.ts` 导入；调用方提供 label、value、options、onValueChange，可传前置 icon。外层控制宽度。
- 约束：选项 value 唯一，label 为文字；选中值属于调用方，组件只保存展开状态。使用 menu/menuitemradio 语义；打开聚焦已选项，方向键循环、Home/End 定位、Enter/Space 选择、Escape 关闭并返回焦点、Tab 离开关闭、点击外部关闭，监听器在关闭和卸载时清理。空选项不产生选择。
- 扩展：当前用于少量排序/筛选项；搜索、异步选项、多选与表单原生提交不属于当前 API。
- 验证：同目录测试检查受控标签与展开前语义，页面 sort 测试验证排序；运行 test/lint/build。人工检查鼠标和键盘、深浅主题、浮层遮挡；平板/H5真机由用户验收。
# 动画补充

菜单保留挂载，通过透明度和位移/缩放过渡显隐；关闭时设置 inert 与 aria-hidden，不接收焦点或指针事件。遵循 reduced-motion。
