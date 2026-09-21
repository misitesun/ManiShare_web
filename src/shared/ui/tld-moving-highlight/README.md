# TLD 移动高亮

- 首次挂载：通过 useEffect 在父容器 ref 完成挂载后启动测量与观察，不能改为子组件 useLayoutEffect 中读取父 ref 后直接提前返回，否则默认已选中却没有高亮。回归必须包含不点击、不 resize 的冷启动和刷新；不能只测切换后的定位。

- 职责：测量选中项并绘制单一滑动或橡皮形变高亮层，不拥有单选/页签语义、业务状态或点击行为。
- 入口：根入口导出 TldMovingHighlight 与 Props；containerRef 指向直接承载高亮的定位容器，activeKey 匹配选项的 data-highlight-key；motion 选择普通滑动或橡皮形变，axis 指定形变方向。
- 约束：容器 relative isolate；选项本身不得建立 z-index/transform/opacity 层叠上下文；默认及 hover 背景 z-0，高亮 z-10，图片、文字与点击覆盖层 z-20。高亮 pointer-events-none，不阻拦原生 radio、按钮及键盘操作。
- 响应式：基于实际 DOM 几何，支持横排、竖排、多行网格、滚动容器、边框与不同卡片尺寸；ResizeObserver、子节点变化、容器自身过渡完成和窗口 resize 触发重新测量，卸载清理。容器从缩放状态入场时，首次测量先去除视觉 scale，再在 transitionend 后校准最终几何，避免高亮自身二次放大。首次无选中项或目标缺失不显示，不从原点入场。普通模式使用 200ms 位移/尺寸过渡；rubber 模式沿 axis 先覆盖新旧目标区间，再在落点压缩并回弹，快速切换从当前几何继续；二者都尊重 reduced-motion。
- 扩展：tone 控制品牌实心色、品牌起始色、强调绿、纯边框、柔和底色或语义 surface hover 实心底色；shape 支持普通、卡片与胶囊左右端。`surface` 用于菜单等临时指针/焦点反馈，不表示已提交的选中状态；`brand`、`brand-start` 和 `accent-green` 可用于细线等已选状态。不得加入导师、排行或导航业务；不允许缩放容器后测量。
- 验证：geometry.test.ts 覆盖网格、滚动、边框及小数尺寸；test/lint/build；PC 回归导师、场景、榜单周期与指标，平板/H5 待用户验收。
