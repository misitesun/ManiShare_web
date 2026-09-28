# TldSwitch

- 职责：受控开关；label、checked、onCheckedChange，支持 disabled。使用原生按钮与 switch 语义，支持键盘、焦点、状态过渡和 reduced-motion。
- 入口：`index.ts` 导出组件和 Props。
- 约束：无业务状态、不访问接口或存储，使用语义主题色，兼容 dark/light；尺寸由父级布局控制。
- 扩展：新增外观需求先扩展语义 Props，不开放任意样式覆盖。
- 外观：轨道 36×20px，白色圆点 16×16px，关闭在左、开启向右移动 16px，过渡 200ms；reduced-motion 下直接切换。圆点使用两套主题均为白色的 `inverse` 前景色，不使用深色主题为透明的 `icon-contrast`。
- 验证：同目录渲染契约测试；页面浏览器核对键盘和受控状态，平板/H5由用户验收。运行 test/lint/build。
