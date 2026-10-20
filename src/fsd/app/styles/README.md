# Tailwind 与全局主题

- 练习笔记侧栏复用`dialog-border`五层渐变、`dialog-surface/accent`、`foreground/hint`及`accent-green`；编辑框为绿色70%描边。新增`button-solid-disabled`：dark来自Figma空输入态的#58BF8D，light以#A3D4BA配合现有深绿按钮适配，仅`TldButton note-action + solid`显式消费。笔记控件不消费练习答题色偏好，dark/light均完整注册；未运行本轮测试、构建或PC视觉验收。

- 退出练习使用`practice-exit-home/course`及对应`-border`四个语义色。dark来自Figma `546:32006/32007` 的两卡填充/描边，light以品牌色与现有surface混合适配。仅退出弹窗显式消费，图片与箭头使用原稿本地素材，白色圆形箭头槽复用media-foreground，不改变其他练习或主题默认值。

- 分段控件显式glass外观使用`segment-outline`：dark为原稿#575757，light回退border-strong。只新增该语义色并由shared/tld-segmented-tabs消费；字号复用tab-label-regular。

- 课程加载进度使用`progress-loading-start/end/track/caption`及`shadow-progress-loading-inset`：dark精确引用品牌紫绿、canvas黑及header-action绿，轨道双向6px/10px绿色内阴影；light引用当前主题品牌/canvas/强调色并降低阴影浓度。仅新`TldProgressBar loading`和练习加载文案显式消费，其他进度默认值不变；响应式字号复用`text-body-notice`并显式校正设计行高。

- 单词局部工具栏使用`practice-control-surface/text/accent`三项语义token；dark来自六张原稿的#22232a、白色和#00bf63，light回退现有surface-raised/text-primary/accent-green。仅`TldSwitch`、`TldSelect`的practice显式变体和练习页私有工具栏消费，不改既有默认值或用户答题色。原稿字号为14/12/10px、400字重；20/18/14px行高是当前居中实现值，未把TEXT框高当作已核实行高。图标通过原SVG及语义filter/mask适配浅色。

- 模式选择使用`mode-selection-selected-fill/selected-border/preview-caption`背景及`mode-selection-option`阴影：dark紫绿10%填充/90%描边、蓝紫遮罩、白15%选中光晕来自546:31207/2315:26276；light引用主题品牌和独立光晕色适配。`text-action-label-flat`为H5 16/16→md18/18，服务48px操作按钮；旧主题和字号默认值不变。

- `mode-selection-thumbnail-overlay`按音频/视频/猜词/看图原稿给未选插图叠加固定20%黑色蒙层，dark/light完整定义；单词/句子原稿不叠加。它只影响固定插画，不能复用为文字或通用禁用色。

- `dialog`阈值为56.25rem（默认初始字号下900 CSS px），在弹窗可用宽度足够时切为原稿两列。与sm/md/design保持同单位、同排序规则，防止手机/平板的两列选项规则在PC覆盖单列列表；不修改根字号或按视口整体缩放。

- 推广奖励显式扩展tab-label-comfortable（16/24→18/26→≥1920px20/28）、metric-blue/purple/green统计底框、content-strong高对比内容文字、row-alternate表格交替行、review-pending/failed/approved审核徽标。全部由dark/light完整语义token暴露，原字号和颜色默认值不变；业务不写原始颜色或主题分支。

- 正文提示变体：`text-body-notice` 为H5 14/20、md16/22、≥1920px18/25，课程详情领取态显式消费，既有正文默认不变。`hint` 在dark提供白色60%、light提供深色60%，仅表达辅助提示文字，不借用页签或操作文案语义。

- 展示页签：`text-tab-label-display` 为16/24→20/28→24/34（H5→md→≥1920px）有界阶梯，外语逆袭秘籍经共享页签display变体消费；原default/compact阶梯不变。`tab-inactive` 在dark精确输出设计的白色60%，light使用深色60%，由主题维护，组件不判断主题。

practice-answer、practice-text、practice-background 映射局部 --app-color-practice-*；默认引用当前主题brand/text/canvas。设置预览或练习会话根可注入经校验的用户颜色，不覆盖整站主题，新增消费者须保持数据校验和局部作用域。

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

- 设置紧凑开关的关闭轨道新增switch-off，dark/light均为中性灰；开启沿用accent-green，其他开关消费者不变。

外观练习背景：practice-preset-default/warm/green/blue提供完整dark/light配色；practice-image-mask在dark为黑、light为白，由局部opacity控制遮罩浓度。answer-default-dark/light分别提供“夜间模式默认色”#00e088与“白天模式默认色”#10bb82，两主题均完整注册并保持固定选色；practice-design-answer随当前主题引用对应预设，避免theme与具名默认色分叉。2026-10-20纠正旧预设误用白/黑导致已保存dark-default/light-default覆盖设计绿的问题。设置色块预览与练习会话共用该映射；句子theme默认色、用户六位HEX自选色和其他文字色不变，不迁移或清空偏好。

- 首版练习注释色：新增 `practice-pos-pronoun`、`practice-pos-verb`、`practice-pos-noun`、`practice-pos-adverb` 与 `practice-syntax-subject`、`practice-syntax-predicate`、`practice-syntax-object`、`practice-syntax-complement` 共八项语义 token，固定教学配色在 `:root` 定义、由 dark/light 共同继承，经 `@theme inline` 暴露；组件不硬编码原始色或根据主题分支。当前只覆盖本地示例实际出现的类型，其余配色按文档后续补齐；语法填充亮度只调填充层，文字/划线/词性色保持。练习默认字号及几何按设计 reference 核对；用户字号档位的实际消费以练习实现清单记录，未接通时不得声称已生效，也不能用设置预览固定字号冒充1920px设计值。本轮PC计算样式、几何与视觉验证结果及剩余限制见[练习页开发文档第17.4节](../../../../docs/practice-page-development.md#174-验证记录)，平板/H5视觉和真机兼容由用户验收。

- 单词设计层：`practice-card`、`practice-deck`、`practice-phoneme` 分别表达主卡、叠层卡和音素块，配合 `--app-shadow-practice-card`；dark 的值来自已读取 Figma，light 分别回退 surface/surface-raised/surface-recessed 与既有 panel shadow。`--app-color-practice-design-answer` 的 dark / light 值分别为原稿明确标注的 `#00e088` / `#10bb82`；练习在用户选色为 theme 时局部使用该默认，不改整站 brand，也不覆盖合法用户自选色。`practice-muted` 单独表达单词辅助文字：dark为白色60%，light回退原secondary；合法用户文字选色可在练习局部覆盖。所有默认变体只供真实练习消费者显式使用，实际基准几何和视觉验收仍单独记录。

- 音标模式状态：`phonetics-highlight`、`phonetics-error`、`phonetics-success`、`phonetics-placeholder`、`phonetics-card` 五项 token 经全局语义 utility 暴露；dark 使用已读取 Figma 的强调、错误、正确、占位和卡片颜色，light 分别回退 brand/danger/accent-green/surface-raised/surface，保持浅色可辨识。它们只表达音标界面展示状态，不把模拟正确/错误状态扩展为正式判题规则。

- 句子作答设计层：`sentence-answer-line`、`sentence-reveal`与六项`sentence-block*`语义色、选中阴影和托盘渐变表达中译英底线、自查按钮及拼块候选/选中/禁用态。dark数值来自546:33828/34043/34529/34539/34548/34546，light回退既有表面、边框和强调色；托盘三停点各自为`app-color-sentence-tray-*`，梯度只引用token。普通句面默认使用独立的`--app-color-practice-sentence-answer`：dark保留设计纯白`#ffffff`，light回退原正文色`--app-color-text-primary`，整站primary默认值不变。单词/指法默认使用明确练习绿；合法用户选色仍覆盖这两类默认。

- `design`响应式阈值为120rem，对应项目默认初始字号下的1920 CSS px。练习设计基准变体与Tailwind的`md`/`xl`统一使用rem阈值，保证基准样式排在平板规则之后。2026-10-15生产DOM验证曾复现混用px任意阈值时40px被`md`的34px覆盖，回归检查直接量取1920px实际字号和几何。只新增阈值命名，尺寸/字号仍按原设计px逐项定义，根字号和整页缩放机制不变。

- `--app-filter-practice-icon`在dark保持原稿白色SVG，light反相使辅助操作在浅色卡面可见，只用于单词卡的播放/笔记/查词/添加图标，不反相彩色插图。生产冒烟核对实际filter并保存浅色截图，文字配色通过不替代图标可见性核验。

- 指法虚拟键盘：`practice-key-*`固定按指区提供彩色键帽，`practice-keyboard-*`提供底板、立体高光、文字和目标/实际输入/错误三类状态，`practice-hand-*`为半透明手层与指尖提示。两主题共享固定插画配色，不受用户答题/文字选色影响。颜色仅在本入口定义，键帽/标签/手层使用同一页面私有几何，不新增全局业务class；验证见练习开发文档“36. 指法虚拟键盘”。

- 2026-10-19声纹配色：audio-wave-start/end仅服务学习声纹的32列、SVG渐变和SiriWave原版曲线，均引用当前主题的brand绿色；设置录音/朗读预览与练习声纹同步使用。组件只消费语义utility，Canvas构造器经getComputedStyle读取同一token，不按主题名分支。原Lottie自身矢量配色作为业务资源原样保留，不注入全站主题。

- 统一课程封面：`cover-glare`与`shadow-tilted-cover`由本入口提供完整dark/light值，供`shared/ui/tld-tilted-cover`的光泽与活动阴影使用；原有封面尺寸、颜色和各页面字号不变。倾斜、缩放、指针位置只通过局部CSS几何变量更新，组件无主题分支。


- 沉浸听力显式变体：practice-pos-label是两主题共同的固定教学标签黑字，仅供彩色词性底色上的文字；既有practice-pos-*与practice-syntax-*数值保持。--app-shadow-sentence-listening-oral在dark使用546:33658的0 4px 18.1px rgba(73,255,104,1)，light引用既有panel阴影，只由新的听力口语按钮显式消费。划线、成分文字和词性层不消费填充亮度。
