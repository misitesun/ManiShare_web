# 完整学习设置

- 职责：共同维护发音、专项、答题、特效、外观、快捷键、系统七 Tab 的编辑、预览、本机持久化和背景图处理；供独立设置页及练习内完整弹窗复用同一份实现。
- 入口：根 `index.ts` 导出 `LearningSettingsProvider`、`LearningSettingsEditor`、`useLearningSettingsSnapshot`、`PracticeBackgroundSurface` 和必要类型/Tab 解析函数；快捷键公开 `ShortcutPreferences`、`ShortcutPreferenceKey`、`ShortcutInput`、`shortcutFields`、`captureShortcut`、`shortcutError`、`getEffectiveShortcut` 和 `matchesShortcut`。内部 Hook 不作为公共入口，不在两个消费者里各自恢复、保存一份状态。
- 所有者：app 的共同 Provider 装配点只挂载一次 `LearningSettingsProvider`，内部唯一调用偏好与背景图 Hook。独立页、弹窗、外观预览和练习消费同源值；打开/关闭设置不能重建练习会话。状态不使用跨标签页同步或新增全局状态库。
- 编辑器：`LearningSettingsEditor({activeTab,onTabChange,presentation})` 由容器控制 Tab；`page` 保留独立页面版心及壳层 sticky 偏移，`dialog` 使用弹窗内部滚动和顶部偏移。窄屏 Tab 横滚，内容流式重排；两个容器不复制表单。Tab panel 与 radio group 使用实例标识，避免同时挂载时重名。
- 读取：`useLearningSettingsSnapshot()` 返回 `values / ready / saveError / background`；background 保留 `image / ready / busy / error / upload / remove`。练习仅按已实现能力消费参数；修改设置不自动播放、切题或录音。全站 dark/light 主题仍由 `shared/theme` 单独维护。
- 约束：只经根公共入口消费，不横向导入页面，不将设置业务放入 shared；真实判题和录音评分不属于设置模块。练习页消费同一快捷键匹配与校验入口，设置编辑器不负责题目动作派发。

## 持久化与兼容

- 仍经 `shared/lib/storage` 访问 `learningPreferences`、`practiceBackgroundImage`，不新增键或版本。对应键分别为 `english-learning-preferences-v1` 和 `english-learning-practice-background-image-v1`。
- 首次渲染使用确定默认值，挂载后校验恢复；未就绪禁用编辑。version 1、逐字段回退、合法隐藏旧字段继续保留。旧 sound/listening 查询兼容保留。
- 快捷键共五项：`playShortcut/masteredShortcut/unfamiliarShortcut` 默认 `Shift + L/J/K`，`previousShortcut/nextShortcut` 默认 `Shift + ArrowLeft/ArrowRight`。保存与显示使用同一格式：有效修饰键按 `Alt + Shift + Meta` 顺序，字母大写、空格为 `Space`、方向为 `ArrowLeft/ArrowRight`。支持 Shift + 字母、Alt/Meta 组合及功能键；编辑器拒绝 Ctrl 并提示改用 Shift。切题键与手动上一题/下一题执行相同动作，其具体执行和能力门控归练习页。
- 旧v1缺少切题字段时仅补两项默认，不丢弃合法旧三项。五项中语法合法的旧 Ctrl 组合在解析时改为 Shift，保留主键及 Alt/Meta、规范修饰键顺序，已有 Shift 只保留一次。迁移后与主流程或其他快捷键冲突的值仍保留原字母，设置列表显示冲突与暂不生效提示，`getEffectiveShortcut(values,key)`返回`null`，不静默换键；修正后重新按校验结果生效。非法语法逐项回默认。
- Shift 数字/标点统一采用标准英文可逆字符对的基础键身份：例如旧 `Ctrl + 1`、`Ctrl + ;` 保留为 `Shift + 1`、`Shift + ;`，实际 `event.key` 为 `!`、`:` 时匹配同一身份；历史显式 `Shift + !`、`Shift + :` 写法也归一为基础键。解析、录入、有效提示、匹配与冲突比较共用这一规范，因此 `Shift + 1` 和 `Shift + !` 不能作为两项不同绑定绕过重复检测。字母保持大写，Alt/Meta 修饰键保留；没有 Shift 的符号自定义不改。只按实际 `event.key` 的明确英文字符对归一，不根据 `event.code` 猜测非美式键盘的物理位置。
- 仅挂载后实际读到合法 Ctrl 旧字段时，才向原 v1 键回写完整迁移结果一次；空缓存、坏值及已为 Shift/Alt/Meta/功能键的缓存不自动写入默认值。Strict Mode 重放不重复迁移；读写失败保留当前可用内存，沿既有 `saveError` 与存储错误通知反馈，迁移写失败仍可使用本页的 Shift 选择。SSR 首帧不读写存储。
- Enter、空格、V、Esc与无修饰上下方向键保留给练习主流程或面板显隐；新增或编辑配置时拒绝冲突。`ShortcutPreferences`只包含五项绑定，练习先调用`getEffectiveShortcut`，非`null`时再用`matchesShortcut(event,value)`精确匹配全部修饰键。`isShortcut` 仅为兼容解析保留 Ctrl 语法，未迁移 Ctrl 值不可注册，实际 Ctrl 按键也不触发练习动作；Meta 不代替 Shift。输入/IME、长按、浮层与题态优先级仍由练习作用域处理。
- 偏好写失败保留本次新内存值并提示刷新后无法恢复，不冒充已保存，不清理其他模块。背景图保存/压缩失败保留旧图；过期上传结果丢弃，Provider 卸载时清理异步序号。
- 背景图和来源偏好是两个存储键，不构成原子事务。图保存成功但来源偏好写失败时，图片仍保留，偏好内存立即更新且保留保存失败提示；不将两者状态显示为完整成功。选择纯色不删已存图片，移除只清独立图片键。
- 图片接受签名有效的 JPG/PNG/WebP，最大 10MiB；等比限制最长边 2560px、不放大小图，优先 WebP、兼容 JPEG，保存 data URL 最多 1MiB 字符。恢复校验版本、格式、尺寸；不开放 blob CSP 或使用任意 CSS。
- 自定义练习颜色是经校验的用户内容，只作用局部练习/预览语义变量；背景、主题和语法填充亮度职责不混用。预览字号映射不代替练习设计稿尺寸。
- 答题颜色的`dark-default`／`light-default`是两个固定选色，分别通过`answer-default-dark/light`解析为设计要求的夜间绿`#00e088`／白天绿`#10bb82`；不是固定白／黑，也不切换全站主题。设置色块、预览推导与练习使用同一语义token，已有v1具名偏好无需重写即可使用修正值；`theme`按具体练习场景选默认，六位HEX自定义色保持用户选择。

## 扩展与验证

### 原版声纹与反馈动画（2026-10-19）

声纹保留`recordingWave`/`readingWave`五种中文值，`LearningAudioWave`由本feature持有并经根入口给设置、口语演示和媒体朗读复用。32列竖条/矩阵/雨滴、70px声纹槽与原版曲线/线条沿用当前参考形态；五种样式统一使用当前主题的brand绿色，设置预览与练习一致。只在可见且活动时运行，reduced-motion静态显示。SiriWave按需加载，尺寸/主题变化重建并清理旧实例。预览不申请麦克风，口语仍标注演示；朗读只跟随媒体真正playing，waiting/pause/ended/error时消失，不把预加载或play请求视为已经朗读。

`AnimationEffectSettings`将原5个emoji选择替换为7份150px原版Lottie卡片及独立章节完成预览。资源/速度/稳定ID归`model/feedback-animations.ts`，预览与练习经根入口`getLearningAnimation`/`resolveCorrectAnimationId`消费同一注册表；其他设置布局和声音选项保持。新增`LearningAnimationId`公开7种答对ID和`chapter-complete`。`correctEffectType`默认改为原版第一份`lottie-0`；5个合法历史emoji值统一回退该项，不声称与原效果等价。v1键/版本不变，读取不自动写回默认；后续实际编辑按原保存流程写入，不清空其他偏好。

依赖经`shared/lib/animation`唯一入口，采用原参考版本lottie-web与siriwave；原始文件、来源、摘要和体积见[素材说明](assets/feedback/README.md)。CI的frozen-lockfile和现有单元测试覆盖新增依赖及映射，额外执行`pnpm run settings-effects:smoke`验证静态Web/Electron真实播放、清理与请求边界。PC1440×900/100%核对150px卡片、20px卡间距及70px波形槽，并分别验证双主题与真实125%/150%/200%缩放；平板/H5仅自动几何不等于视觉真机验收。

设置值、选项、默认值与合法历史数据不因提取而更改。图片/视频位置只适用句子/音频/视频中译英；本期仍只实现默认垂直布局，看图学词按子模式布局。完整规则见 [练习开发文档](../../../../docs/practice-page-development.md)、[配色方案](../../../../docs/practice-page-color-scheme.md) 和 [统一按键契约](../../../../docs/practice-keyboard-shortcuts.md)。

颜色和快捷键子弹窗复用 `shared/ui/tld-dialog` 的最上层关闭、焦点限制、背景 inert 与滚动锁；子窗关闭返回父窗控件，最终关闭返回练习设置入口。不为设置复用注册练习全局按键监听，快捷键编辑器只在编辑时录入配置。

就近测试覆盖原偏好与背景图校验、Ctrl→Shift 五字段迁移与 modifier 去重、Shift 数字/标点真实字符与历史别名归一/碰撞、仅迁移时回写/失败保留内存、切题字段兼容恢复、主流程/重复冲突的停用与可见反馈、实际 Shift 匹配及 Ctrl 拒绝、逐项范围、预览语义以及 Provider 的确定预渲染默认值和缺失 Provider 失败。运行 `pnpm run test && pnpm run lint && pnpm run build`；浏览器回归七 Tab、同源更新、保存失败、上传/替换/移除、独立页 query、练习原题与输入保留及两层弹窗。PC 按 1920px 设计基准核对；平板/H5 视觉与真机兼容待用户验收。
