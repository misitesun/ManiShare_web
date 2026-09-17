# TLD 移动高亮

- 首次挂载：通过 useEffect 在父容器 ref 完成挂载后启动测量与观察，不能改为子组件 useLayoutEffect 中读取父 ref 后直接提前返回，否则默认已选中却没有高亮。回归必须包含不点击、不 resize 的冷启动和刷新；不能只测切换后的定位。

- 职责：测量选中项并绘制单一滑动高亮层，不拥有单选/页签语义、业务状态或点击行为。
- 入口：根入口导出 TldMovingHighlight 与 Props；containerRef 指向直接承载高亮的定位容器，activeKey 匹配选项的 data-highlight-key。
- 约束：容器 relative isolate；选项本身不得建立 z-index/transform/opacity 层叠上下文；默认及 hover 背景 z-0，高亮 z-10，图片、文字与点击覆盖层 z-20。高亮 pointer-events-none，不阻拦原生 radio、按钮及键盘操作。
- 响应式：基于实际 DOM 几何，支持横排、竖排、多行网格、滚动容器、边框与不同卡片尺寸；ResizeObserver、子节点变化和窗口 resize 触发重新测量，卸载清理。首次无选中项或目标缺失不显示，不从原点入场。200ms 位移/尺寸过渡，尊重 reduced-motion。
- 扩展：tone 控制纯边框/柔和底色；shape 支持普通、卡片与胶囊左右端。不得加入导师或排行业务；不允许缩放容器后测量。
- 验证：geometry.test.ts 覆盖网格、滚动、边框及小数尺寸；test/lint/build；PC 回归导师、场景、榜单周期与指标，平板/H5 待用户验收。
