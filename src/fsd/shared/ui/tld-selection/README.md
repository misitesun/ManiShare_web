# TldSelection

- 单选：传 `type="radio"`，同组使用相同 `name`、不同 `value`；消费者维护唯一选中值。默认仍为 checkbox，不影响既有批量选择。`indicatorPlacement="bottom"` 将 card 指示器放在右下角，默认 top 保持原布局。AI 助教页复用此模式，无请求或存储副作用。

- 职责：受控圆形逐项选择按钮；label、checked、onCheckedChange，支持 disabled。批量勾选使用原生 checkbox 语义而非互斥 radio；业务维护选中ID。支持键盘、焦点和 reduced-motion。
- 入口：`index.ts` 导出组件和 Props。
- 约束：无业务状态、不访问接口或存储，使用语义主题色，兼容 dark/light；尺寸由父级布局控制。
- 扩展：新增外观需求先扩展语义 Props，不开放任意样式覆盖。
- `tone` 控制选中背景：默认 selection 为绿色品牌色，danger 为红色危险色；选中均显示白色圆角对号，未选中保持中性底色和边框。使用语义主题 token，不接受任意颜色字符串。查漏补缺普通选择用默认色，作品/收藏删除编辑态显式传 danger；深浅主题保持同样动作语义。
- `layout` 默认 control（36px点击区）；card 模式填满父容器，圆形指示器固定右上角并加主题底色以适配图片背景；inline 模式在同一可点击 label 内展示圆形指示器和可见文案，适用于反馈表单、对话设置等逐行选项。三个模式均为单个原生 input，不嵌套按钮。
- 验证：同目录渲染契约测试；页面浏览器核对键盘和受控状态，平板/H5由用户验收。运行 test/lint/build。
