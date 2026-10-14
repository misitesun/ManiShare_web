# TldSwitch

`size="compact"` 是显式紧凑设计变体：32×20轨道、16px滑块、13px标签间距，标签使用body-tight；H5/平板最小点击高度40px，xl采用22px紧凑行高。默认轨道36×20及既有样式保持。该变体不改变受控checked、disabled、名称或descriptionId，查漏补缺是当前消费者。

设置行可传 showLabel=false，仅隐藏重复的可见标签，aria-label 保留完整名称；descriptionId 可关联行内说明。默认 showLabel=true，现有页面不改变。组件仍保留独立可点击区域和键盘操作。

按钮保留 relative 定位：sr-only 是绝对定位标签，若没有按钮作为包含块，长设置页中的标签可能越过壳层滚动裁剪并撑出 html 外层滚动条，导致版心右边界少15px。设置生产冒烟检查外层不滚动，PC版心与收藏页对照验证。

- 职责：受控开关；label、checked、onCheckedChange，支持 disabled。使用原生按钮与 switch 语义，支持键盘、焦点、状态过渡和 reduced-motion。
- 入口：`index.ts` 导出组件和 Props。
- 约束：无业务状态、不访问接口或存储，使用语义主题色，兼容 dark/light；尺寸由父级布局控制。
- 扩展：新增外观需求先扩展语义 Props，不开放任意样式覆盖。
- 外观：轨道 36×20px，白色圆点 16×16px，关闭在左、开启向右移动 16px，过渡 200ms；reduced-motion 下直接切换。圆点使用两套主题均为白色的 `inverse` 前景色，不使用深色主题为透明的 `icon-contrast`。
- 验证：同目录渲染契约测试；页面浏览器核对键盘和受控状态，平板/H5由用户验收。运行 test/lint/build。
