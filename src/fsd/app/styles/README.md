# Tailwind 与全局主题

- 推广奖励显式扩展tab-label-comfortable（16/24→18/26→≥1920px20/28）、metric-blue/purple/green统计底框、content-strong高对比内容文字、row-alternate表格交替行、review-pending/failed/approved审核徽标。全部由dark/light完整语义token暴露，原字号和颜色默认值不变；业务不写原始颜色或主题分支。

- 正文提示变体：`text-body-notice` 为H5 14/20、md16/22、≥1920px18/25，课程详情领取态显式消费，既有正文默认不变。`hint` 在dark提供白色60%、light提供深色60%，仅表达辅助提示文字，不借用页签或操作文案语义。

- 展示页签：`text-tab-label-display` 为16/24→20/28→24/34（H5→md→≥1920px）有界阶梯，外语逆袭秘籍经共享页签display变体消费；原default/compact阶梯不变。`tab-inactive` 在dark精确输出设计的白色60%，light使用深色60%，由主题维护，组件不判断主题。

practice-answer、practice-text、practice-background 映射局部 --app-color-practice-*；默认引用当前主题brand/text/canvas。设置页预览根可注入经校验的用户颜色，不覆盖整站主题，新增消费者须保持数据校验和局部作用域。

- 职责：导入 Tailwind CSS v4，定义 dark/light 原始主题值、响应式语义字号、语义 utility 映射、基础初始化、共享渐变文字 keyframe 和全局 reduced-motion/View Transition 规则。
- 入口：`index.css`，只能由 `src/app/layout.tsx` 导入一次。
- 字体：sans/brand/login统一以Microsoft YaHei优先，依次回退PingFang SC和系统字体；按本机可用字体选择，不是严格OS识别，Android通常回退系统中文字体。用户未要求打包Web字体，不新增字体请求或资源。
- 设计基准：按docs/decisions/0018-reference-fidelity-and-responsive-reflow.md，在参考CSS视口/100%缩放逐项核对字号、行高、字重、间距和几何；默认语义角色不能覆盖设计值。紧凑变体保持其他消费者默认阶梯：body-tight和tab-label-compact为H5 14/20、md以上16/22；action-label-compact为H5 16/22、md以上18/25（字号/行高）。页签与开关、说明和错题正文显式消费相应变体。
- 约束：Tailwind `source("../../..")` 只扫描 `src` renderer 源码，避免 docs/scripts 测试样例污染 production CSS；原始颜色只在本文件的主题变量中出现；组件使用 Tailwind 语义 class，禁止动态拼接 class、硬编码颜色或新增全局业务样式。字号阶梯默认服务 H5，`md` / `xl` 覆盖平板与普通 PC，≥1920px 达到设计稿上限；禁止根字号、`vw` 或整页缩放。
- 扩展：新增主题先在 `shared/config/theme.ts` 注册，再补齐本文件所有 `--app-color-*`、`--app-background-*` 与图标 filter 值和中文名称；dark 的 canvas/surface/brand 基准同时服务 Figma App Shell，`accent-green/cyan/blue/orange/magenta` 提供课程标签和状态标识使用的跨主题分类强调色，`danger-surface` 与 `progress-track` 分别承载状态底色和进度轨道，`icon-contrast`、`--app-filter-shell-icon` 与 `--app-filter-dialog-icon` 让设计稿 SVG 在 light 下保持可辨识且不跨组件语义复用，`tooltip` / `tooltip-text` 为两套主题提供一致的深色文字气泡，`dialog-*` 用于对话框遮罩和表面渐变，`login-*` 是登录落地页语义 token，`membership-*` 的文字色与 `membership-*` 渐变背景分别服务跨页面会员标签，`home-*` 服务首页排行榜，home-star-*为新星光榜的榜台/时长，两主题完整定义；原home-podium文字仍由PK消费。media-foreground专用于固定插画上的文字，不随light变为深色。`3xl` 固定为 1800px，用于宽屏界面增强；首页在 1440px 起保持原三列位置，视口达到 1920px 时才恢复固定列宽。字号提供页面标题、区块标题、卡片标题、正文、标签、辅助文字、页签和强调操作八个角色，新增角色必须有真实消费者。
- 验证：`pnpm run lint && pnpm run build`；Codex 仅在 PC 设计尺寸（未指定时 1440×900）人工检查 dark/light，390×844 H5 与 768×1024 平板视觉由用户验收。

- 登录改版：field-label为14/20、form-action为16/22，服务多个登录/注册表单与共享glass输入/form按钮；form-title为H520/28→md22/31。原字体角色和共享默认消费者不变。login-form-*、login-input-*、login-panel-*、login-placeholder/divider/outline/qr-overlay及app-shadow-login-input在两主题完整定义；渐变由颜色token组合，不在background变量内散落原始颜色。固定地球插画上的login-primary/secondary/pill在两主题保持浅色，卡片内容独立使用login-form-*，light展示浅色玻璃卡片。旧Aurora、专用色停靠点和未使用动作token随新版删除。

顶部二维码入口hover/focus/展开态使用header-action语义色：dark按原稿#00E088，light复用现有brand绿色以保持对比；不改变其他消费者的brand值。三个动作共同消费此色，图标经原始SVG mask继承文字色。

紧凑操作语义text-action-label-small固定14px/20px，两款短弹窗按钮共用。checkin-highlight dark#00E088/light品牌绿、checkin-glow紫色固定插画光晕，两主题补齐；button-muted dark白20%/light深色12%，只服务通用muted按钮，不替换原secondary/outline。

内容适高弹窗使用dialog-border语义背景，dark按Figma五层径向渐变还原，light补齐对比色；渐变引用--app-color-dialog-border-*，不在组件硬编码颜色，原有弹窗边框不改变。

dialog-title-soft为紧凑俱乐部标题的语义色，dark#D9D9D9/light primary，其他标题不改变。

- VIP套餐视觉：`plan-*` 提供卡片表面/边界、分段分隔与选中、脚注、权益链接、优惠和徽标的语义主题值；VIP页头柔光由该page私有设计背景图承担。dark/light均完整定义，仅显式消费者采用，原membership徽标及全局品牌值不变。

- 奖品兑换设计密度：page-title-compact为22/28→md26/31，tab-label-regular为16/22→md18/25，caption-tight固定12/17；仅显式消费者使用。foreground为dark纯白/light深色主文字，surface-recessed为dark#121317/light白色，status-positive为dark#06DF73/light品牌成功绿；已有primary/surface/success默认不改变。

- 联创与体验展示：collaboration-panel/violet/cyan/blue/gold负责联创卡表面及强调文字；trial-action/border/border-disabled/disabled用于TldButton subtle的正常和禁用态。dark/light完整定义，不调整其他页面品牌或表面默认值。

- PK设计密度：label-regular固定14/20；section-title-display为20/28→md22/31→≥1920px24/34，tight同字号但行高28。room-id-surface、arena-loss/rate/action/writing/writing-border、muted-solid两主题完整定义；三种podium-*-value与media-ink属于固定插画上的文字，保持原图对比。其他字号与颜色默认值不改变。

- PK状态的challenge渐变/轨道、match面板/边框/警告/操作/模式/在线与loading-dot层级经完整dark/light token维护；match-panel inset shadow只在此显式消费者启用。固定图片上的文字继续使用media-foreground；PK标题黑底图片的dark screen/light normal混合由app-blend-pk-art定义，光晕采用原始SVG资源。
