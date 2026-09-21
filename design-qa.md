# 登录页设计验收

**比较目标**

- Source visual truth: Figma `NLXdsc7dSeTlfPLpCc0l3n` / node `1:28`，以及本地原始截图 `/var/folders/py/18yf1bmx1w9f1z5fx19j4nm80000gn/T/codex-clipboard-7ba2d461-69c4-4df8-a1b8-e57ecdfedae4.png`。
- Implementation: `http://127.0.0.1:5174/login`。
- Implementation screenshot: Codex 应用内浏览器的工具原生截图；该浏览器接口未暴露稳定的文件路径。本轮在浏览器中检查了默认 Aurora 的 dark/light 最终画面与动画变化。
- Viewport/state: 中文、无焦点态；基准 CSS viewport 为 `1920 × 1080`，并补充 `1440 × 900` 深色检查。
- Density normalization: 源截图为 `3840 × 2160`（设计稿 `1920 × 1080` 的 @2x 输出）；同屏对比中源图按 `0.28125` 显示为 `540 × 304`，实现以 `1920 × 1080` CSS viewport 同比例显示为 `540 × 304`。浏览器测量时 `devicePixelRatio = 2`。
- Scope constraint: 用户明确撤销“适配成圆形/椭圆弧”的要求，极光不再匹配 Figma 底部圆弧；当前视觉事实为 React Bits Aurora 默认波带翻转纵向后贴底向上展开。表单、认证和跳转仍不在范围内。

**Findings**

- 当前没有遗留的 P0、P1 或 P2 设计差异。
- [P3] 品牌英文字体使用后备字体。
  Location: `src/pages/login/ui/LoginPage.tsx` 的 `manishare` 标识。
  Evidence: Figma 指定 `07NikumaruFont`；当前运行环境未提供该字体文件，页面优先请求该字体并回退到 `Arial Rounded MT Bold`。同屏对比中轮廓和占位接近，但不是同一字体文件。
  Impact: 只影响左上品牌字形的细微曲线，不影响布局、响应式或核心信息层级。
  Fix: 品牌正式确认字体授权与资产后，将字体文件放入页面或品牌资源边界并补充 `@font-face`。

**五项保真检查**

- Fonts and typography: PC 主标题 `80px / 112px`、引文 `24px / 40px`、胶囊 `20px`、主按钮 `24px`、品牌 `40px`，字重与换行符合设计；品牌字体存在上述 P3 后备差异。
- Spacing and layout rhythm: PC 实测胶囊 `y=200`、主标题 `y=294`、引文 `y=558`、主按钮 `y=718`；顶部按钮 `x=1583.48, y=22, w=176.52, h=62`，右边界为 `1760`，与设计的 `160px` 右留白一致。
- Colors and visual tokens: 深色背景、白色正文、50% 次级文字、标题渐变与源稿一致；Aurora 使用 `#8C52FF / #029DFF / #00BF63` 对应的 dark 语义 token，浅色主题消费独立语义 token，不在组件 JSX 内硬编码颜色或写主题样式分支。
- Image quality and asset fidelity: 两个箭头使用 Figma 导出的原始 SVG；Aurora 使用 OGL/WebGL 2 实时渲染 React Bits 默认噪声波带与横向颜色渐变，仅翻转纵向 UV 使其贴底向上展开，不包含椭圆距离场。
- Copy and content: 中文文案、标点、大小写与 Figma 节点一致；中英文 locale key 对称。

**全屏与重点区域证据**

- Full view: 翻转前在 `1920 × 1080` 检查过 dark/light 两个主题；翻转后在 `1440 × 900` 和 `1280 × 720` dark 下复测，Aurora 从页面底部向上展开，紫—蓝—绿横向色带与登录文案布局未被翻转。
- Focused aurora: 检查了默认噪声轮廓、横向三色渐变、主题切换和 `speed=0.5` 的持续变化；本轮不再用 Figma 底部圆弧作为极光验收标准。

**比较迭代历史**

1. 初次检查发现顶部按钮右留白为约 `171px`，相对设计多 `11px`（P2）。将 PC 右定位改为 `8.333333vw`；复测按钮右边界精确落在 `1760px`。
2. 初次检查发现主标题、引文和主按钮整体比设计下移 `8px`（P2）。将 PC 胶囊到标题间距从 `46px` 改为 `38px`；复测得到 `y=294 / 558 / 718`。
3. `320 × 568` 初测中标题换成三行，主按钮与页脚重叠（P2）。将最窄屏标题设为 `40px`、`360px` 以上恢复 `44px`；复测标题保持两行、横向无溢出、主按钮底部 `475.39px`、页脚顶部 `484px`，不再重叠。
4. 用户随后明确不再要求圆形/椭圆适配，因此移除椭圆中心、半径、距离场、band 和 halo 计算，恢复 React Bits Aurora 默认的噪声高度、指数波带、强度和透明度逻辑。高 DPR 下使用 drawing buffer 尺寸的修复继续保留。

**响应式、主题和交互验证**

- `1920 × 1080` dark/light：翻转前无横向或纵向溢出，默认 Aurora、文字、按钮和页脚正常。
- `1440 × 900` dark：翻转后的标准 PC 验收截图中，顶部保持黑色画布，默认波带从底部向上扩展，不遮挡文字或按钮。
- `1280 × 720` dark：翻转后无横向或纵向溢出，极光位于底部并向上展开，Canvas 保持 1 个，控制台无 warning/error。
- `1440 × 900` dark：`scrollWidth=1440`、`scrollHeight=900`，一个 OGL canvas 正常输出，控制台 warning/error 为 0。
- 平板与 H5 继续使用同一全视口 canvas 和既有 mobile-first 布局；依项目当前验收约定，本轮未由 Codex 声称视觉通过，等待用户在平板/H5 与真机最终验收。
- WebGL 2 实测成功创建一个 OGL canvas；路由离开登录页后 canvas 数量恢复为 0，返回后为 1，控制台 warning/error 为 0。
- 连续两张间隔 `500ms` 的页面截图有 `66,748` 个 PNG 字节变化，确认 `speed=0.5` 的默认 Aurora 持续运动；reduced-motion 分支由代码审查确认会取消动画帧并固定渲染首帧，当前浏览器控制接口未提供媒体偏好模拟。
- 两个登录按钮均为原生 `button`；键盘 Tab 可聚焦，并显示 `2px` 主题焦点轮廓。
- 浏览器控制台 warning/error：0。

**Implementation Checklist**

- [x] PC 关键尺寸和坐标对齐。
- [x] 平板和 H5 保留同一响应式 DOM 与全视口 canvas 实现；视觉验收留给用户。
- [x] dark/light 均消费语义主题 token，默认主题仍为 dark。
- [x] Figma 箭头资源落入页面私有 `assets/`。
- [x] React Bits 默认 Aurora 作为页面私有 OGL 视觉接入，未保留椭圆距离场。
- [x] 极光颜色、light/dark、resize、reduced-motion、卸载清理与 WebGL 失败降级均有明确边界。
- [x] 路由、语言资源、模块文档和公共契约同步。

**Follow-up Polish**

- 品牌正式确认 `07NikumaruFont` 的授权和字体文件后，可消除最后一项 P3 字形差异。
- 如需继续精修动态质感，可只调整 React Bits 默认暴露的 `colorStops`、`blend`、`amplitude` 与 `speed`，不改动页面信息结构。

final result: passed
---

# 首页设计验收

**比较目标**

- Source visual truth: Figma `NLXdsc7dSeTlfPLpCc0l3n` / node `307:14199`，以及用户提供的 1920 × 1080 PC 效果图。
- Implementation: `http://127.0.0.1:5174/`。
- Viewport/state: `1920 × 1080`、简体中文、dark 默认主题；补充检查 light 主题、`768 × 1024` 平板结构和 `390 × 844` H5 结构。
- Scope constraint: 本轮只实现静态首页和局部展示交互；中间栏按需求保留空占位，搜索、导航业务跳转、真实排行榜及学习数据接口不在范围内。

**PC 对照结果**

- 应用壳保持 `200px` 侧栏和 `80px` 顶栏；首页内容区实测 `x=200, y=80, w=1720, h=1000`。
- 左栏实宽 `749px`，中间占位 `415px`，右侧排行榜 `478px`，栏间距 `20px`；底部学习花园跨左、中两栏，实测 `w=1184px`。
- 排行榜实测 `x=1420, w=478, h=968`；学习花园实测 `x=216, y=824, w=1184`，与 Figma 的 16px 内容内边距和 20px 分栏节奏一致。
- 公告栏、注意力卡、圆形进度、三行留言、学习统计、内容展示、学习花园、排行榜及中间占位均已落位；PC 未发现横向或纵向页面溢出。
- `2555 × 1141` 超宽屏下，首页保持 `1720px` 宽并在侧栏右侧的 `2355px` 主内容区域内居中，实测 `x=517.5`；未再贴靠左侧或无限拉伸。
- 排行榜前三名舞台固定，榜单下方实际渲染 50 条数据（第 4–53 名）；滚动容器实测 `clientHeight=579`、`scrollHeight=3200`，滚动 720px 后舞台 `y=97` 保持不变。

**组件与资源检查**

- 公告栏和留言框使用作用域内 GSAP 横向动画，并在 reduced-motion 下停用持续位移。
- 圆形进度作为 `shared/ui/tld-progress-bar` 的具名变体复用统一数值标准化；可视环使用 Figma 导出的 SVG，不在业务页面重复绘制。
- 会员等级标签提升到 `shared/ui/tld-membership-badge`，LeftNavBar、个人资料与首页共同消费同一公共入口。
- 学习花盆、内容缩略图、会员图标、榜单背景和用户头像均使用 Figma 导出的本地资源；图片已按实际展示尺寸转为 WebP 或保留必要的 SVG/PNG。
- 学习花园使用共享 Tooltip：空记录显示“没有学习”，有记录显示“学习时长：N分钟”。
- dark/light 只消费语义主题 token，默认仍为 dark；light 主题下页面结构、边界和文字层级保持可辨识。

**响应式与运行验证**

- `1920 × 1080` dark：`scrollWidth=1920`、`scrollHeight=1080`，PC 关键布局完成对照。
- `768 × 1024` dark：`scrollWidth=768`，无全局横向溢出；宽内容在模块内部局部滚动或重排。
- `390 × 844` dark：`scrollWidth=390`，无全局横向溢出；侧栏使用既有 H5 抽屉，首页保持单列内容流。
- `685 × 1209` dark：统计区实测 `258px` 高，三个指标各占一行并统一左对齐；视频区实测 `294px` 高，17 个 `60px` 圆形封面自动形成三行，中央播放标识完整可见，页面 `scrollWidth=685`。
- 视频封面资源原始透明内容框为 `109 × 120`，现已在 `60 × 60` 正圆裁切框内校正横向比例；播放按钮改以裁切框的 `50% / 50%` 为定位基准，视觉检查为正圆且居中。
- `749px / 750px` 临界点：749px 仍使用三条纵向统计，750px 恢复 `138px` 横向统计；两个视口均无横向页面溢出。视频封面不锁定容器高度，在两个视口均按可用宽度自然换行。
- `390 × 844` 补充检查：三个统计指标保持三行，17 个视频封面形成五行，视频区自然增长到 `474px`，`scrollWidth=390`。
- 修改后复测 `1920 × 1080`：统计卡保持 `749 × 138`，视频区由内容自然得到 `749 × 234`，学习花园仍保持 `x=216, y=824, w=1184, h=241`，三栏和底部行未发生位移回归。
- 刷新最终页面后未出现新增浏览器 warning/error；开发过程中更换资源产生的旧 Vite HMR 错误仍保留在浏览器历史日志中，不影响当前页面。
- `pnpm run test`：50 项通过；`pnpm run lint`：通过；`pnpm run build`：通过。
- 按项目验收约定，平板与 H5 本轮只完成结构和溢出检查，不声明视觉验收通过，等待用户真机/目标浏览器确认。

**已知范围与后续**

- 首页所有数据当前是静态 mock；留言只在首次渲染时随机确定展示顺序，刷新后可变化。
- 月份切换按钮、统计页签、搜索和排行榜业务行为暂未接入。
- 中间 `415 × 713` 区域按需求保持占位，后续业务确认后再建立对应模块。

final result: passed for PC; tablet and H5 visual acceptance pending user review

---

# 奖品兑换中心：兑换记录 Design QA

## Evidence

- Source visual truth: https://www.figma.com/design/NLXdsc7dSeTlfPLpCc0l3n/漫奇说?node-id=1097-50030
- Implementation: http://localhost:5173/prize-center（Codex in-app browser capture，兑换记录页签）
- Viewport and state: 1920×1080 CSS px，device pixel ratio 2，dark theme，兑换记录页签选中。
- Source dimensions: Figma frame 1920×1080 logical px。
- Implementation dimensions: 1920×1080 CSS px；浏览器截图按 CSS 几何归一化后比较，未把 2× 屏幕密度当作布局差异。
- Full-view evidence: 页面标题、328px 横幅、三项页签、记录表的整体层级与设计稿一致；文档宽度与视口均为 1920px，无页面级横向溢出。
- Focused-region evidence: 单独检查记录表区域；表格位于 x=450、y=600，宽 1220px、高 262px，表头 54px、数据行 52px，状态标签均为 66×24px。
- Interactions checked: 从默认积分兑换切换至兑换记录；选中态、tabpanel 关联和四条记录均正常展示。
- Console: 未发现 error 日志。

## Findings

- 未发现需要阻断交付的 P0、P1 或 P2 差异。
- PC 表格比设计稿标注的 1212px 宽 8px，这是既有 mainPage ≥1920px 两侧 250px 流式版心契约产生的预期差异；未设置设计稿固定最大宽度。
- 状态色使用项目 `success` 主题 token，而不是页面硬编码色值，以保留 dark/light 主题契约。

## Required Fidelity Surfaces

- Fonts and typography: 复用项目语义字号；表头 16px、数据 14px、状态 12px，与设计层级一致，无换行或截断。
- Spacing and layout rhythm: 表格顶部、表头、行高、列宽、圆角和交替行背景与设计稿对齐。
- Colors and visual tokens: 使用 `canvas`、`surface-raised`、`primary`、`brand` 与 `success` 语义 token；dark theme 下层级和对比度正确。
- Image quality and asset fidelity: 兑换记录区域没有新增图片或非标准图标；应用壳与横幅占位沿用现有页面实现。
- Copy and content: 表头、四条记录、会员内容、成功状态和日期均与设计稿一致。

## Comparison History

- 预检查发现表格顶部为 y=592，比 Figma 的 y=600 上移 8px；将记录 panel 间距从 20px 调整为 28px后，复测为 y=600。
- 调整后的完整页面和表格聚焦区域均重新检查，未发现新的 P0、P1 或 P2 问题。

## Implementation Checklist

- [x] 语义化表格与稳定记录 ID
- [x] 交替行背景与成功状态标签
- [x] PC 流式版心和窄屏局部横向滚动
- [x] 页签选择与 panel 可访问关联
- [x] 无接口请求或虚假兑换行为

## Follow-up Polish

- 平板和 H5 的视觉、横竖屏与真机滚动体验由用户验收。
- 后续接入真实记录接口时补齐 loading、empty、error 与分页状态。

final result: passed
