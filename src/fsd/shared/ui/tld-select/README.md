# TLD 下拉选择

- 职责：受控单选下拉菜单，提供圆角触发器、浮层与鼠标/键盘聚焦跟随高亮；通过语义 token 适配深浅主题。
- 入口：`TldSelect`、`TldSelectProps`、`TldSelectOption` 从根 `index.ts` 导入；调用方提供 label、value、options、onValueChange，可传前置 icon。`layout="full"`默认由外层控制宽度，`layout="content"`按已选标签、图标及内边距自然撑宽。可成对传open/onOpenChange统一管理多个菜单的展开状态；省略open时仍由组件保存展开状态。
- 约束：选项 value 唯一，label 为文字；选中值属于调用方，组件保存临时高亮状态，展开可受控。使用 menu/menuitemradio 语义；打开聚焦已选项，方向键循环、Home/End 定位、Enter/Space 选择、Escape 关闭并返回焦点、Tab 关闭并按触发器位置继续原生焦点顺序、点击外部关闭，监听器在关闭和卸载时清理。所有展开/关闭路径均通知onOpenChange，外部改变open直接控制显示，不在渲染或Effect中回写父级。打开时高亮已选项（无有效选中值时取首项），指针划过或键盘聚焦只移动单一高亮层；空选项不产生选择。
- 扩展：当前用于少量排序/筛选项；搜索、异步选项、多选与表单原生提交不属于当前 API。
- 验证：同目录测试检查受控标签与展开前语义，页面 sort 测试验证排序；运行 test/lint/build。人工检查鼠标和键盘、深浅主题、浮层遮挡；平板/H5真机由用户验收。
# 动画补充

菜单保留挂载，通过透明度和位移/缩放过渡显隐；关闭时设置 inert 与 aria-hidden，不接收焦点或指针事件。选项跟随高亮复用 `TldMovingHighlight tone="surface"`，以真实选项尺寸定位并使用语义 hover 底色；位移与菜单显隐均遵循 reduced-motion。

`size="settings"` 采用36px触发器、8px圆角、10px内边距、12/17px字号及0.01em字距；默认40px触发器不变，展开菜单仍保留40px选项和既有键盘行为。

设置变体的18px箭头来自 Figma `2539:8237`，资源位于本模块assets，沿用壳图标filter适配浅色主题。

`size="practice"` 为练习左上角工具栏的显式密度：xl触发器高26px、4px圆角、无边框、左4px内边距、0间距、14px/20px/400常规字距，文字与18px设置箭头自然相邻，槽宽由调用方或content布局决定；H5/平板触发器和菜单选项最小40px，xl选项最小26px。触发器和菜单使用practice-control-surface，文字使用practice-control-text，选中项使用practice-control-accent。菜单保留menuitemradio、可见键盘焦点和受控选择，恢复与查漏补缺“创建日期”同源的surface移动高亮；高亮z-10、文字relative z-20、菜单isolate，底色只跟随指针/焦点，已提交选择仍由绿色文字与aria-checked表达。空白或禁用目标的外点关闭后回到触发器，其他可聚焦操作（含summary）按浏览器正常聚焦；祖先的tabindex=-1程序聚焦根不当作可点击操作，避免空白关闭后焦点遗留在已inert的菜单内。默认/settings外观不变。SSR测试覆盖外部open、选中语义与关闭inert；PC浏览器继续核对冷启动、指针与键盘滑动、互斥菜单、外部点击、Escape、Tab、方向键、reduced-motion与焦点返回。

## 内容宽度与 Portal 菜单

`layout="content"`不使用固定槽宽；practice触发器改为左右各4px内边距，保留14/20px字号、18px箭头与40px/xl26px高度。默认`layout="full"`的左内边距、宽度与所有既有密度保持原契约，调用方自行决定一行、换行或局部横向滚动。

`menuPosition="inline"`是默认值，菜单保留在原组件DOM内。对`overflow-x-auto`等裁切容器，可显式使用`menuPosition="portal"`：挂载后才把菜单放到`document.body`，首次服务端渲染不读取DOM。菜单用fixed定位跟随触发器，监听触发器/菜单ResizeObserver、捕获阶段scroll、窗口resize与visualViewport的scroll/resize；关闭或卸载时清理。菜单至少覆盖触发器宽度，按选项内容扩宽，并限制在可见视口内，底部空间不足时向上展开，最高256px。

Portal菜单仍归同一个React组件与受控展开状态管理，触发器通过`aria-controls`关联定位后的菜单。外点与失焦同时检查触发区、Portal菜单，因此点击菜单、方向键、Escape、Tab与选择后返回触发器仍正常；关闭立即inert/aria-hidden，保留上一次定位以完成原150ms淡出。未启用Portal的消费者不改变DOM归属或层级。Portal是z50，使用方应核实其与自身模态/浮层的层级关系，不应用于未经授权的全局交互变更。

验证：`TldSelect.test.ts`覆盖默认契约、自然宽度密度与Portal预渲染确定性；`select-menu-position.test.ts`覆盖触发器对齐、长选项、320px窄视口、visualViewport偏移、横向滚动后的边缘夹紧、向上展开和高度限制。实际Portal菜单开关、滚动跟随、焦点与主题通过具体消费页面的运行时专项验证。
