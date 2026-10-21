# 漫奇说 Web 技术选型与基础能力地图

- 通用模拟口语评测：`features/oral-assessment` 对外提供四阶段弹窗、目标／结果契约与可取消控制器，首个消费者为单词拼写答对后入口。页面注入设置声纹和现有提示音，不横向依赖其他 feature；不采集麦克风、不请求评分、不生成录音。Figma资源和属性已读取，状态用例已补但未执行；PC、平板、H5待用户验收。见[源码与范围记录](practice-oral-assessment-development.md)。

- 练习共用音效：`features/learning-settings`持有37份原始本地声音及公开注册表／设置试听，`shared/lib/sound-player`提供按需创建、可复用短音效、代次隔离和清理；练习通过feature根入口消费，设置不反向导入page。四组音色／音量与切题／评价开关沿原v1偏好，已删除旧完成音色并迁移到默认落幕。首批完整接线为单词拼读／拼写，公共切题／完成事件沿同一入口可复用。MP3经现有Web／Electron resolver返回audio/mpeg及单区间，不新增IPC、权限、依赖或外部请求。回归用例已补但按用户要求未执行测试、构建或试听，细节见[素材记录](practice-feedback-assets.md)。

- 单词拼读第三方查词：页面私有`word-dictionary`／`WordDictionaryLink`统一正面搜索与解析背面图标，原生外链打开当前单词的欧路页面；无嵌入、抓取或额外词典API请求。Electron的`dictionary-navigation`只批准可信renderer的欧路词条链接交给系统浏览器，其余新窗口及主窗口外站导航继续拒绝，不新增preload／IPC或依赖。加号“不熟”保存只登记到项目待办，等正式接口接入；本轮未运行测试／构建或外链运行时验收。

- 单词卡解析：`pages/practice`内部`WordPronunciationAnalysis`／`useWordCardFlip`提供同卡Y轴翻面、返回、当前词释义和双语例句，按题目ID切题复位；`word-card-analysis-demo`补足十词各三句，显式中英文高亮、缺项空态及缺音源提示。与CardSwap拖拽分层，稳定后二维显示，支持reduced-motion；仅消费现有主题token，不新增请求、存储、依赖或公共入口。按用户要求未运行测试／构建，视觉与真机待用户查看。

- 单词拼读笔记：`pages/practice`内部`PracticeNotesPanel`／`practice-notes`／`usePracticeNotes`提供本章题目ID唯一的本轮文本笔记，支持列表、保存／编辑／删除／取消和1000原生单位计数。组件与预留接线保留，拼读首图标现为卡内解析，暂不另设笔记入口；记住／排序／重练保留已存内容，关闭丢未存输入；不新增接口、Storage键、路由或依赖。共享`TldDialog`根入口新增可选`placement="right"`（默认center）及`TldDialogPlacement`类型，240ms右滑、可见视口约束、模态隔离和reduced-motion；`TldButton note-action + solid`提供26px PC／40px H5密度，双主题新增`button-solid-disabled`。素材跟随practice，其他笔记本页面不共享本轮状态。已补模型／几何／SSR用例但按本次用户要求未运行测试或构建，PC及移动端效果均待查看。

- 单词拼读卡堆：`pages/practice/ui/CardSwap.tsx`直接挂载用户提供的完整CardSwap组件，保留其卡片实例、order/phase、rAF、速度采样、惯性与补位，不再由外接Hook编排动效。任意方向拖动均只下一题、显式上一题恢复、末题完成，不循环展示已看题目；原上下题按钮/快捷键进入同一组件入口。选择接受后即提交题号并继续运动，支持运动中连续操作；拖动中底栏和快捷键保持可用，interruptDrag保留当前位姿并接续命令，迟到松手不重复推进；末题收尾仍阻断。卡面和原素材按Figma `546:31237`保持500px基准，窄屏流式重排；暂停/浮层/重置/卸载取消运动，reduced-motion直接更新。无新请求、存储、依赖、路由、主题token或Electron能力；来源和许可见模块内记录，平板/H5真机待用户验收。

- 退出练习：`pages/practice/ui/PracticeExitDialog`提供原稿首页/课程插画与继续按钮；继续、X、Esc及遮罩取消退出，保持当前作答，所有动作在既有退场结束后执行。`PracticePageRoute`注入`onExit`，首页走`/`、课程走来源白名单，缺失/非法来源回`/awakening/`。打开时冻结计时/口语演示并暂停媒体且保留位置，取消不自动播放，窗口失焦暂停仍独立生效。共享按钮新增显式`dialog-emphasis`密度，样式新增完整深浅主题的四个`practice-exit-*`token；无新路由、参数、请求、Storage、依赖或Electron bridge。

- 练习暂停：页面私有`practice-pause`/`usePracticePause`管理窗口失焦和标签隐藏，暂停独立于题内浮层；失焦同步冻结真实计时及口语演示，返回后手动继续，卸载清理监听与任务。`PracticePauseDialog`复用既有模态隔离/动画/主题，`TldButton dialog-slim`显式提供32px PC／44px H5、14/20字及10px内边距；原按钮消费者不变。无新增路由、Storage键、请求、依赖、主题token或Electron bridge。

- 单词/句子内容弹窗由`pages/practice`私有组件消费已有题目列表，支持默认中文、英文与双语、内部滚动及原切题动作。`TldSegmentedTabs appearance="glass"`仅显式消费时使用46px/8px/常规文字与`segment-outline`，其他控件/内容族不改；无新路由、请求、Storage键、依赖或Electron能力。

- 完成练习：`pages/practice/ui/PracticeCompletionDialog`使用当前本地题数、“—”今日时长及禁用下一章；共用结束入口和统一命令绑定，重练/返回在退场后执行。`shared/ui/tld-button`新增显式`dialog-compact`密度（44px/r8/16px常规字重），默认消费者不变；弹窗沿已有`TldDialog`生命周期和主题，不新增路由、请求、Storage键、依赖、主题token或Electron能力。

- 章节草稿：`pages/practice`的`PracticeDraftPanel`提供右侧滑入/拖动、输入、清空与内存保存反馈；非模态且不停止媒体。状态在小模式会话key之外，按app验证的课程/章节scope共用；跨题/模式/关闭重开保留，刷新/退出清除。`sourceChapter`仅是本地章节来源，无后台或本机持久化。验收与兼容边界见[开发文档33](practice-page-development.md#33-章节共用草稿浮窗2026-10-16)。

- 模式选择：`features/practice-mode-selection`由课程详情章节和练习“模式”共同消费，六族共33项（单词6、句子7、音频7、视频6、猜词3、看图4）；独立缩略图、515×315预览、原稿不同窗高/位置、取消与开始状态分离。13张章节卡均可本地演示，保留11个VIP标记；独立指法、音标及四类纯内容直接进入。来源白名单、合法demo/mode与退出返回由app装配，不新增后台请求、正式题库/权限或存储契约。当前验收见[练习开发文档第20节](practice-page-development.md#20-六族模式选择与全部章节演示入口2026-10-16)。

- PK争霸：`pages/pk-arena` 提供 `/pk/` 首页示例大厅，包含三位置活动插画演示轮播、统计、我的创建、房号搜索、房间卡和三类排行榜。轮播/筛选/榜单切换/取消为页面内状态；确认取消同步移除我的创建与大厅对应示例房间。创建通过 features/pk-create-room 完整本地配置，替换自己的示例房间并清空搜索，关闭丢弃草稿，刷新恢复初始数据；新增全屏匹配/加载演示页，邀请/机器人提示未接入，开启仅进入固定72%加载；记录、真实匹配与对战尚未接入；不发起业务请求或新增持久化、依赖及桌面能力。

- 设置：完整编辑、校验、本机保存、预览和背景图归属 `features/learning-settings`；app 单次装配 `LearningSettingsProvider`，`pages/settings` 仅适配独立 `/settings/?tab=`，练习弹窗复用受控 `LearningSettingsEditor` 和同源快照。七 Tab 不复制、不横向导入页面，原存储键与 v1 合法历史数据保持；主题仍复用 `shared/theme`，不请求额外业务接口。运行能力以 [练习开发文档](practice-page-development.md) 为准，技术入口见 [完整设置说明](../src/fsd/features/learning-settings/README.md)。

- 练习首版：`pages/practice` 已建立独立 `/practice/` 静态演示选择与本地会话，覆盖单词、句子、音频、视频、看图学词、独立指法、音标、猜词及四类阅读器的展示组合；`demo` / `mode` 只表达演示视图，不是正式课程或章节 ID。输入编辑、词块选择、答案/结果和浮层为本地演示；完整设置弹窗复用共同 feature，关闭后保留原会话。彩色键盘/半透明手的独立分层素材尚缺，当前保留指法展示区域及特殊键演示状态，不冒充已完成原稿键盘。无后台接口，正式判题、录音评分和学习记录提交留待后续；固定底栏与练习命令按键已接入本地示例；1920px 精确视觉验收仍待完成。

- 练习媒体首版：已封装 `PracticeMedia` 与页面私有媒体控制器，支持受控音频/视频元素、播放/暂停/停止、进度、倍速/音量、加载/失败、播放互斥及切题/卸载清理；当前音频/视频演示分别接入自行生成的两秒 WAV 正弦音与无音轨 H.264 MP4，固定地址为 `/practice-demo/technical-tone.wav` 和 `/practice-demo/technical-video.mp4`，通过 `PracticeMedia.source` 注入并明确显示“技术验证片段，非课程音视频”；它们用于播放器验证，不填补课程发音、视频或特效音色缺项。无源场景仍明确“素材未接入”并禁用播放，不假播。`OralDemoPanel` 只展示待录、录音中、评测中、结果和失败等带演示说明的状态，不申请麦克风、不录制、不上传、不评分。技术片段来源与格式见 [技术媒体说明](../public/practice-demo/README.md)，正式业务音视频及其实际播放兼容仍待素材接入和验证；云端 TTS、正式朗读调度与真实录音评测暂缓。

- 练习特效首版：`pages/practice` 内已建立动画层、短音效控制器与明确演示事件，动画复用 `shared/lib/animation`，由演示答对/章节完成事件触发；揭晓不计答对。短音效按配置开关、类型、音量和事件 ID 去重消费，当前映射素材缺项时明确反馈，不用同一声音冒充全部音色。打字/评测结束只供演示入口，不新增按键监听或评分服务。设置打开/修改/恢复不自动播放；暂停、切题、关闭或退出时清理，装饰层不挡点击并遵守 reduced-motion。素材缺项及正式素材待接入详见 [特效素材清单](practice-feedback-assets.md)，不因控制器已实现就声明全部音色可听。

- 练习按键：固定底栏覆盖现有40组合，`practice-bindings` / `practice-shortcuts` / `usePracticeCommands`共同管理有效绑定、作用域与单一监听；点击和键盘使用同一执行入口。默认朗读 / 掌握 / 不熟为Shift+L/J/K、切题为Shift+←/→；五项自定义沿原v1键缓存，挂载时将旧Ctrl修饰键一次替换为Shift，保留主键及其余修饰键并去重，转换冲突保留、可见停用。设置允许Shift字母、禁止新Ctrl录入，Alt / Meta / 功能键继续可用；顶部答案 / 音标讲解独立显隐，切题重置题内状态、清理播放和口语流程。Enter / 空格 / V按模式与阶段派发，原生编辑、IME与重复激活分开保护；作答输入内仅Shift+字符（包括大写字母，且无Ctrl / Alt / Meta）保留原生输入，Ctrl / Meta+A/C/X/V/Z/Y保留编辑，不触发练习动作。`showEvaluation`继续同时控制附加口语按钮与V入口，独立口语不受影响。真实自定义键盘高亮、正式判题和录音评分未接入；规则唯一维护于[统一按键契约](practice-keyboard-shortcuts.md)，旧验证见开发文档第32节，最新Shift修正与验证见第35节。

- `shared/ui/tld-moving-highlight`：无业务移动高亮层，按选项 DOM 几何适配横排、竖排、多行网格与内部滚动，支持普通滑动以及按横/纵轴拉伸、落点、回弹的橡皮形变。AI 导师选择、聊天场景、排行榜周期与指标、下拉菜单指针/焦点反馈、玩家档案子导航活动线统一复用；保留各消费者原生交互语义。

- AI 助教：`pages/ai-tutor` 提供 `/ai-tutor/` 静态导师/场景选择和 `/ai-tutor/mentors/[mentorId]/scenes/[sceneId]/` 一屏聊天 UI；包含场景滑动选中、内部滚动、返回恢复选择和文字/语音输入模式切换，不接入对话或录音接口。`TldSelection` 支持 radio/name/value 和卡片指示器位置，默认 checkbox 保持兼容。

- 下拉单选：`shared/ui/tld-select` 提供受控 `TldSelect`，支持深浅主题、已选项反馈、键盘选择和外部关闭；业务排序由所属页面实现。菜单显隐支持过渡，全部密度（含练习practice）下指针划过与键盘聚焦共用单一跟随高亮层，关闭时 inert 隔离焦点。可选`layout="content"`让触发器随文字与padding撑宽，可选`menuPosition="portal"`在挂载后以body固定浮层避开局部滚动裁切；默认full/inline不变，Portal保留菜单语义、动画、外点及键盘焦点。单词工具栏显式启用两项，手机音标下拉与平板/PC音标组共用状态；音标组继续复用`TldMovingHighlight`的`practice-outline`绿色透明轮廓。
- 表单控件：`shared/ui/tld-input` 提供 `TldInput`（焦点边框与淡阴影）；`shared/ui/tld-switch` 提供 `TldSwitch`（受控开关）；`shared/ui/tld-selection` 提供 `TldSelection`（圆形逐项 checkbox）。均支持可访问名称、禁用和主题色；选择和显隐动画遵循 reduced-motion，业务状态留在页面。
- 图片选择：`shared/ui/tld-image-upload` 提供受控的单张/多张本地图片选择、预览和移除，负责 Object URL 回收；不上传、不压缩、不请求接口。顶栏反馈由 `features/submit-feedback` 组合单选、描述与截图，当前提交只关闭并重置静态表单。
- 练习错误反馈：`pages/practice/ui/PracticeErrorFeedbackDialog`按当前题展示英文/翻译、七类多选与必填描述；截图仅本地预览，提交提示接口未接入并保留输入，关闭即清空。复用`TldDialog`已有referenceFrame/焦点/滚动隔离，`TldSelection appearance="ring-compact"`、`TldButton size="form-wide"`与`TldImageUpload appearance="outlined"`提供显式原稿密度，默认消费者保持。图片`previewSource="data-url"`在现有self/data CSP下预览，清理未完成读取并隔离过期回调；原默认Object URL分支继续回收。无业务请求、存储键、主题token、路由、依赖或Electron bridge变化。

本文回答三个问题：框架已经提供什么、后续业务应该从哪里接入、哪些能力当前明确不做。详细约束仍以 `AGENTS.md`、专题文档和各模块 README 为准；本文件是导航和边界地图，不替代它们。

## 1. 项目目录

```text
漫奇说web/
├── src/
│   ├── app/             # 应用启动、路由、Provider、全局样式和配置装配
│   ├── pages/           # 路由入口、页面编排和页面私有实现
│   ├── widgets/         # 跨页面复用的完整界面区块
│   ├── features/        # 用户可感知的业务动作
│   ├── entities/        # 稳定业务对象
│   └── shared/          # 无业务归属的配置、基础设施和基础 UI
├── electron/            # Electron 主进程、preload 和桌面桥接
├── public/              # 确实需要固定 URL 的公开静态资源
├── scripts/             # 仓库校验、开发启动和资源处理脚本
├── docs/                # 架构、开发、兼容性、ADR 和能力文档
├── .agents/skills/      # 随仓库维护的 Codex 团队工作流
└── .github/workflows/   # 持续集成
```

`src` 遵守 `app → pages → widgets → features → entities → shared` 单向依赖。业务 slice 只经根 `index.ts` 暴露公共 API；`electron` 是同一 React renderer 的桌面宿主，不属于 FSD 层，也不能被业务组件直接导入。

业务资源跟随所属模块进入局部 `assets/`。`public/` 只保存需要固定 URL 的发布资源；禁止用 `public/` 或全局 `src/assets` 作为图片、图标和视频收纳目录。

## 2. 技术选型

| 技术 | 当前用途 | 边界 |
| --- | --- | --- |
| React 19 | 函数组件、Hook 和客户端渲染 | 不引入 Next.js、RSC 或服务端框架约定 |
| TypeScript strict | 请求、领域、组件与公共能力类型 | 禁止 `any`、非空断言和未校验外部数据 |
| Next.js 16.3.6 | App Router、开发服务器、类型生成与静态导出 | bundler 为 Turbopack，构建目标 staging/production |
| Tailwind CSS 4 | 页面和组件样式、mobile-first 响应式、跨页面语义字号 | 颜色只来自语义主题 token；字号按角色缩放且在 1920px 达到设计上限；不并行维护 Sass/CSS Modules |
| Next App Router | page/layout/error/not-found 与 Client 导航 | URL 源在 `src/fsd/app/config`；动态参数由 owner 根入口枚举 |
| i18next | 仅初始化 `zh-CN` 兼容词典供已有 t() 消费者使用 | 不加载英文，不恢复旧语言偏好，不提供切换或多语言同步验收；新文案直接中文 |
| GSAP + `@gsap/react` | 交互动效和 React 生命周期管理 | 只从 `shared/lib/animation` 导入，限定作用域并尊重 reduced-motion |
| React Bits | 候选动画、文字和背景的可调整源码来源 | 新版登录使用Figma地球位图，旧Aurora及OGL依赖已删除；未来组件仅按真实消费者逐个引入并适配本仓库契约 |
| Electron | 安全桌面壳和窄 preload/IPC | renderer 不接触 Node/Electron API |
| pnpm 10.28.2 | 唯一依赖与命令执行器 | lockfile 唯一；安装脚本使用精确白名单 |
| EditorConfig + Prettier 3 | 源代码、脚本和配置的统一格式 | 4 个空格缩进、禁止 Tab；Markdown、生成锁文件和静态资源不机械改写 |
| Oxlint + 项目脚本 | 类型、FSD、Tailwind、模块文档和 Skill 契约 | 不通过放宽检查脚本绕过真实违规 |
| Node Test Runner + tsx | 公共能力和脚本单元测试 | 组件/E2E 等真实需求出现后再选型 |

## 3. 公共能力入口

| 能力 | 唯一入口 | 已提供 | 当前不负责 |
| --- | --- | --- | --- |
| 应用配置 | `src/fsd/shared/config` | 环境、API 默认值、语言、时区、分页、存储键、主题注册 | 用户文案、领域枚举、业务规则 |
| 项目标识 | `src/fsd/shared/constants` | 品牌名、工作名、缩写和跨页面共享的小管家形象 | 可翻译文案、课程或用户数据 |
| HTTP | `src/fsd/shared/api` | 方法封装、查询参数、超时、认证头、`HttpError` | 领域端点、DTO 校验、缓存、自动重试 |
| 主题 | `src/fsd/shared/theme` 与 `src/fsd/app/styles/index.css` | dark/light 注册、应用、持久化、语义 token、切换过渡 | 组件内主题分支、业务颜色硬编码 |
| 响应式字号 | `src/fsd/app/styles/index.css` | 页面/区块/卡片标题、正文、标签、辅助文字、页签和强调操作的 mobile-first 语义 utility | 根字号缩放、统一 `vw` 倍率、特殊品牌或排行榜视觉 |
| 中文兼容词典 | `src/fsd/shared/i18n` | 只加载zh-CN供已有t()消费者使用，不恢复旧英文偏好 | 语言切换、多语言翻译、英文同步验收、学习内容语言模型 |
| 完整学习设置 | `src/fsd/features/learning-settings` | 七 Tab 受控编辑器、唯一 Provider、同源偏好/背景图快照、校验、预览及 v1 持久化兼容 | 正式判题、云端朗读、真实录音评分；练习命令执行器归页面 |
| Web Storage | `src/fsd/shared/lib/storage` | `StorageSchema` 约束的 LocalStorage 访问 | SessionStorage 直连、数据库或服务端会话 |
| 时间 | `src/fsd/shared/lib/time` | locale 和默认 IANA 时区的日期时间展示、挂载后单调毫秒测量 | 学习日历、连续天数、计时暂停及倒计时业务规则 |
| 剪贴板 | `src/fsd/shared/lib/clipboard` | 非空文本复制和布尔结果 | 用户提示 UI |
| 下载 | `src/fsd/shared/lib/download` | Blob/URL 下载和临时 URL 回收 | 导出格式、内容权限和文件业务规则 |
| 动画 | `src/fsd/shared/lib/animation` | GSAP 注册、`gsap` 与 `useGSAP` 稳定入口 | 跨页面全局时间线或具体业务动画编排 |
| 通知 | `src/fsd/shared/notification` | success/info/warning/error/confirm 统一入口 | 业务文案和权限判断 |
| 通用按钮 | `src/fsd/shared/ui/tld-button` | 主/次文字按钮、统一尺寸、整行宽度、交互光标和禁用态 | 业务点击状态、图标按钮、导航页签或链接语义 |
| 跟随封面 | `src/fsd/shared/ui/tld-tilted-cover` | 稳定图片槽位内的鼠标倾斜、光泽、轻微缩放与阴影；CSS过渡、逐帧合并及清理；触控/reduced-motion静态 | 课程资源、布局比例、点击/播放/选择、翻面、持久化或业务请求 |
| 动作下拉菜单 | `src/fsd/shared/ui/tld-dropdown-menu` | 图标触发器、动作列表、键盘/焦点、Portal定位、视口夹紧和移动高亮；选择后同步执行调用方回调 | 业务动作定义、单选值、路由、持久化或异步请求 |
| 返回入口 | `src/fsd/shared/ui/tld-back-button` | Figma 箭头、统一外观、显式目标的 Link 导航和自定义文案 | 猜测历史栈、业务取消确认和路径拼装 |
| 渐变文字 | `src/fsd/shared/ui/tld-gradient-text` | 可传颜色、速度、方向、往返、hover 暂停和可选边框的动态渐变文字 | 业务文案、点击行为、筛选状态或页面级动画 |
| 会员标签 | `src/fsd/shared/ui/tld-membership-badge` | 黄金 VIP、终身 VIP、漫奇天使和免费体验的图标、渐变底托与三档尺寸 | 用户权益、会员状态判断和业务文案 |
| 进度展示 | `src/fsd/shared/ui/tld-progress-bar` | 数值归一化、可选数值文案、medium/large/challenge/loading显式轨道与无障碍进度语义；loading提供渐变边框和内阴影 | 业务进度计算、计时、请求或状态所有权 |
| 列表分页状态 | `src/fsd/shared/ui/tld-pagination-status` | 触底自动加载哨兵、加载中、无更多和失败重试反馈 | 页码、接口、列表数据和领域错误规则 |
| 提现明细区块 | `src/fsd/widgets/withdrawal-records` | 推广收益与分公司的提现表格、静态分页、状态徽标、收款码弹窗和审核说明提示 | 真实提现请求、审核规则、结算状态或用户通知 |
| 通用页签 | `src/fsd/shared/ui/tld-segmented-tabs` | 受控单选页签/筛选组、橡皮形变分段渐变和动态下划线、文字/横线/底线独立配置、真实尺寸校准与基础无障碍语义 | 业务筛选状态、路由、页签文案和拖拽切换 |
| Tooltip 文字提示 | `src/fsd/shared/ui/tooltip` | Portal 定位、四方向、自定义高度、hover/focus 交互，以及可选共享 Group 的跨触发项跟随、尺寸过渡和速度倾斜 | 业务文案、触发条件或导航状态 |
| Dialog 对话框 | `src/fsd/shared/ui/tld-dialog` | 受控 Portal、渐变边框、2px 背景模糊遮罩、响应式尺寸（含802px与流式full）、居中标题、内容/底部插槽、统一操作按钮、最上层关闭/焦点优先级及可重入滚动锁；可选MotionProvider作用域统一进退场，保留关闭画面并提供onAfterClose | 业务表单、提交状态、接口错误或全局弹窗队列 |
| PWA 预留 | `src/fsd/shared/lib/pwa` | 安装生命周期监听与状态 Hook | manifest、Service Worker、离线缓存和发布 |

推广奖励设计使用提现区块显式contrasted外观，分公司保留默认外观；字段和行为同源。pages/promotion-revenue通过isFreeTrial受控输入显示免费体验插画与提示、阻止明细内容和分页挂载，会员/收益接口尚未接入。shared页签comfortable/generous、按钮mini/solid与全局语义token显式消费，既有默认消费者不变。

新增公共能力前先搜索现有入口。页面私有 UI、Hook、状态和资源默认留在 `pages/<page>`；只有独立用户业务进入 `features`，跨页面大型组合进入 `widgets`。第二个真实消费者只触发重新判断；确认能力没有业务语义后，才下沉到双方共同允许依赖的最低层。不能先建 `shared/utils`、`hooks` 或 `services` 等万能目录。

## 4. 应用与多端能力

| 能力 | 所有者 | 当前契约 |
| --- | --- | --- |
| 路由 | `src/fsd/app/config/routes.ts`、`src/app` 各路由 `page.tsx` 与 `src/fsd/app/router` Client 装配 | `/` 是学习首页静态编排，`/courses/search/` 使用空白功能区域，`/profile/` 是玩家资料页，`/profile/knowledge-gaps/` 是查漏补缺静态分页列表，`/profile/notes/` 是笔记本双视图静态分页列表，`/profile/learning-progress/` 是学习进度静态分页列表，`/profile/favorites/` 是我的收藏分类、整卡多选与本地删除静态列表，`/profile/works/` 是我的作品整卡多选与本地删除静态列表，`/foreign-language-guide/` 是外语逆袭秘籍静态课程分页列表，`/collaboration/` 是联创天使静态权益和支付页，`/vip/` 是畅学 VIP 静态方案页，`/leaderboard/` 是固定头尾与内部滚动分页的学习排行榜，`/prize-center/` 是奖品兑换中心的其他兑换插画空态、未接接口的权益兑换表单与四条演示兑换记录，`/promotion/revenue/` 是推广收益概览与佣金静态分页列表，`/branch-company/` 是分公司结算概览与奖励静态分页列表，`/login/` 为独立品牌首屏，`/practice/` 为无 App Shell 的本地练习演示入口；当前29个路由契约、目标275份业务HTML |
| 课程集合编辑 | `src/fsd/features/edit-course-collection` | 我的收藏与我的作品共用浏览/编辑、整卡多选、取消和本地删除状态；页面仍分别拥有数据、筛选、分页和提示文案 |
| 创建PK房间 | `src/fsd/features/pk-create-room` | 六组完整配置、课程单选、章节多选和更多展开、题型/模式联动、有效配置回调；调用方负责模拟房间替换，卸载丢弃草稿，不发起请求或新增持久化 |
| 笔记本二级页 | `src/fsd/pages/notebook-course` | `/profile/notes/courses/[coursePackageId]/` 课程包概要、全部笔记和八个章节卡片；`view=courses` 恢复课程列表 |
| 章节笔记页 | `src/fsd/pages/notebook-chapter` | `/profile/notes/courses/[coursePackageId]/chapters/[chapterId]/` 展示对应章节笔记，返回恢复课程列表，未知参数显示空态 |
| 共享笔记区 | `src/fsd/widgets/notebook-notes`、`src/fsd/entities/notebook` | 两级页面统一记录展示、删除确认和演示数据；分页由一级页拥有，新增/编辑仍为静态入口 |
| 响应式壳层 | `src/fsd/widgets/app-layout` | 同一开关状态驱动跨端侧栏动画；H5 使用不推动主内容且可完全离场的覆盖式抽屉，`md` 平板与 `xl` PC/Electron 在 200px 侧栏和保留头像/导航图标的 64px 轨道间切换，1920px 宽屏展示完整标签文案；联创天使使用整行品牌渐变，排行榜后接通风采大赛暂未开放页与奖品兑换中心路由 |
| 风采大赛 | `src/fsd/pages/competition` | `/competition/` 展示设计原图与暂未开放提示；侧栏真实导航、选中高亮和刷新恢复，不接比赛接口 |
| 分公司 | `src/fsd/pages/branch-company` | 侧栏底部钻石入口、结算概览、奖励明细静态分页，并复用跨页面提现明细区块；不发起接口请求或推导提现规则 |
| 学习首页 | `src/fsd/pages/home` | 新版1920px三栏与1720px特殊版心、六项统计与五范围切换、五位置占位轮播、插画陪伴展示与分享提示、实际日历月份切换、原始三道光束星光榜和50条内部滚动示例行；70×70云朵IP通过页面私有Portal悬浮，支持鼠标/触摸拖动、方向键移动、悬停动效及两行提示、边缘校正，刷新复位且无位置持久化；首次进入时通过 TldDialog 展示定位说明并持久化确认标记，不请求定位权限；平板/H5 使用同一语义 DOM 重排 |
| 登录与注册 | `src/fsd/pages/login` | Figma地球背景品牌首屏、五种登录与三种注册入口、输入清空/密码显隐/字段与协议校验；view查询恢复视图，dark/light卡片与三端响应式；前端交互无认证请求/敏感持久化，真实验证码与认证尚未接入 |
| Electron | `electron/`、`electron-builder.yml` | Web/H5/Electron 共用 renderer；桌面能力只通过具名 preload API 与校验 sender 的 IPC |
| 兼容性知识 | `docs/compatibility.md` | 运行时差异必须进入登记契约，明确 fallback、cleanup、自动验证和人工复测 |

响应式不是整体缩放设计画布。默认样式服务 H5，`md:` 和 `xl:` 只在必要位置重排、扩容或调整字号；PC 设计值可以精确实现，平板和 H5 仍可以用明确的 class 指定大小，也可以在设计允许时使用 `clamp()` 做有上下限的流式变化。

## 5. Hook 与状态放置

Hook 是封装 React 状态、生命周期、事件处理或外部同步的函数，不是单独的架构层。项目不建立统一 `src/hooks`：

- 业务动作的 Hook 放在所属 `features/<feature>`；
- 稳定领域状态放在所属 `entities/<entity>`；
- 页面或 widget 私有 Hook 留在自己的 slice；
- 主题、语言、动画等无业务且已有公共契约的 Hook 才从命名明确的 `shared` 能力暴露。

状态只提升到真实消费者的最近共同所有者。可由 props/state 推导的值在渲染中计算；Effect 只用于同步外部系统，并负责清理监听、计时器、订阅和可继续运行的异步工作。

## 6. 依赖与供应链边界

新增依赖先说明现有能力、标准 Web API 或更小方案为什么不足。运行时依赖用 `pnpm add`，开发依赖用 `pnpm add -D`，并同步 `package.json`、`pnpm-lock.yaml`、文档和 CI。

pnpm 依赖安装脚本默认拒绝执行，`pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 是唯一白名单：

- `esbuild`：tsx 构建需要的本地二进制。

没有实际依赖消费者的包不得保留在白名单中。`electron-winstaller` 的安装脚本仍被拒绝；当前 Electron Windows 目标是 NSIS，不能仅为消除安装提示而批准未使用的 Squirrel 辅助包。

新增白名单必须审查安装脚本、下载/编译行为、产物影响和替代方案，记录包名、用途与风险，并仅执行 `pnpm approve-builds <明确包名>`。禁止全量批准。

## 7. 验证与非目标

默认验证：

```bash
pnpm run format:check
pnpm run test
pnpm run lint
pnpm run build
```

只有 Electron 边界或桌面构建受影响时再运行 `pnpm run desktop:build`。视觉或响应式任务仍需面向 390×844、768×1024、1440×900 实现，但 Codex 只人工验收 PC（优先任务指定的桌面尺寸，未指定时为 1440×900）；平板/H5 的视觉与真机兼容由用户验收，并在交接中标为待用户验收。相关主题、reduced-motion 和运行时降级按实际受影响范围复测。

已确认的练习首版封装内聚于 `pages/practice`：媒体基础控制、录音状态演示、事件驱动动画与本地短音效控制器；完整设置因两个真实消费者提升到 `features/learning-settings`。不预建全局媒体/特效框架、供应商适配、真实录音评测或完整 PWA。未确认能力仍须先明确真实需求、数据契约和多端行为，再按 FSD 建立对应模块；素材与PC精确验收缺项单独记录。
- `TldInput` 同时服务查漏补缺和 AppLayout 顶部搜索，统一 hover/focus 绿色边框，提供 medium/large 尺寸与 trailingAction 尾部操作槽；不负责业务搜索或路由。
- 设计基准与响应式重排按ADR0018分段验收；全局字体栈微软雅黑→苹方→系统字体，紧凑正文/页签/操作字号由全局入口维护。TldSegmentedTabs提供compact typography/gap，TldSwitch提供compact size，TldProgressBar提供wide spacing；查漏补缺显式消费，原默认消费者不变。
- 收藏与作品编辑的选择覆盖层统一消费 `TldSelection layout="card"`：整卡原生 checkbox 点击区、右上角圆形指示器、主题底色与选中动画；不再维护独立选中/未选中图片。
- `TldSelection` 使用白色对号标记选中，`tone="selection"`（默认）为绿色普通选择，`tone="danger"` 为红色删除选择；作品/收藏编辑覆盖层使用 danger，查漏补缺保持默认。
- `TldSegmentedTabs` 分段变体用独立局部渐变层和文字裁剪层完成橡皮拉伸、落点和回弹；underline 变体复用 `TldMovingHighlight` 对固定、文字或整段宽度的横线执行同样动画，活动文字、横线与底线可独立配置。几何均依据真实 DOM 测量，reduced-motion 下立即切换，动画只经 `shared/lib/animation` 使用现有 GSAP。
- `TldDialog` H5 高度随内容自适应，操作按钮同排等宽，单按钮占满操作区；md 及以上保留原有尺寸与最小高度，正文仍可内部滚动。
- 言灵觉醒：`pages/awakening`，路由 `/awakening/`，三排静态选项、原稿课程封面与分页演示；`/awakening/courses/[courseId]/` 提供课程详情静态预览，固定面包屑、简介与章节共同内部滚动，复用进度条和开关。收藏/助手仅本地展示状态，详情“开始学习”进入 `/practice/` 演示选择；13张章节卡按大类型选择模式或直达本地练习，原VIP标识保留并明确演示可体验，重置、筛选及正式权限/学习业务待接口确认。

- 外语逆袭秘籍消费共享页签display字号变体与spacious间距，基准24/34、60px文案间距；全局tab-label-display阶梯16/24→20/28→24/34，现有default/compact契约不变。
- 课程详情领取模块展示静态未解锁提示，本页拥有云朵锁定资源，不借用侧栏示例VIP徽标判断权限。全局body-notice为14/20→16/22→18/25提示正文阶梯，hint提供两主题的辅助提示色；真实领取、购买与会员授权未接入。

全局顶部玩家俱乐部/客服咨询/玩法介绍二维码浮层由widgets/app-layout拥有，app明确注入三种action，复用设计示例二维码。玩法介绍点击仅提示链接暂未配置；真实后台二维码和超链接后续独立接入，无业务请求。

首页进入流程：pages/home编排定位→本地每日签到→俱乐部→不再提示确认；daily-checkin负责签到记录，TldDemoQr共用示例码；dailyCheckin/homeClubPrompt是本机版本化存储，上海自然日去重和永久关闭只针对自动提示。当前无真实签到、学习阈值或入群接口。

## VIP新版套餐展示

`pages/vip-membership` 私有模型按周/月/季/年生成完整权益，价格保留四份设计稿原值；无支付和接口。共享根入口新增 `TldButton size="plan"`、`TldSegmentedTabs appearance="neutral"`，视觉token由 `app/styles` 完整定义dark/light，默认消费者不变。PC以1920×1191对照；平板/H5视觉和真机待用户验收。

- 奖品兑换中心显式使用页签regular/spread与page-title-compact密度，原有共享消费者默认值保持；本页拥有横幅与期待插画。记录表使用foreground/surface-recessed/status-positive两主题token。兑换、记录请求和真实用户数据未接入。

VIP分类扩展：`pages/vip-membership` 私有实现联创权益、免费体验两种状态与本地领取演示；无网络请求和持久化。顶部柔光、分类栏外框及128/162px选中态使用Figma装饰背景图，文案保持DOM。共享按钮显式扩展plan-compact与subtle，主题token完整覆盖dark/light；详见VIP及按钮README，现有默认消费者保持原样。

- PK首页使用最新ManiShare 176:1234稿：1920px左右24px、150×100封面、纵向房间卡与452px榜单；三个轮播位置默认中间，左右循环，本地创建/取消/搜索/榜单继续复用。四个共享视觉变体显式消费，不改变默认消费者，未接业务接口。

- PK状态页766:49937/49998：pages/pk-arena内聚两个全屏静态页面及资源，首页三个入口进入固定演示房间，取消仅离开，邀请/机器人提示，加载72%不进入练习；PK自身无业务请求与新增持久化；加入练习演示入口后，全项目路由/产物目标为29/275。

- 练习配色新增八项真实示例 token：词性 `practice-pos-pronoun/verb/noun/adverb`、句子成分 `practice-syntax-subject/predicate/object/complement`。固定教学色由全局 `:root` 定义、两主题继承，页面按完整字面量消费；只覆盖当前示例，不等于完整配色表已实现。语法亮度只影响填充层。
- 本轮验证状态：275份HTML为构建契约目标；1920px基准100%缩放的字号、行高、字重、间距和几何精确核对及较窄PC重排需由实际验收补充，当前不声明已通过。平板/H5视觉与真机兼容仍待用户验收。

- 技术媒体宿主影响：`electron/renderer-contract.ts` 的静态资源解析新增 `.wav → audio/wav`、`.mp4 → video/mp4`，严格静态预览和 Electron 协议共用该映射。仅新增文件类型识别，CSP、资源404、路径校验和 Electron bridge 均保持；相关说明见 [Next 静态兼容契约](compatibility/next-static-runtime.md)。自制样例文件存在或 MIME 单测不代表真实浏览器播放已验收。

- 练习设计主题补充：单词主卡/叠层/音素块消费 `practice-card/deck/phoneme` 与卡片阴影，设计默认答题色使用 `practice-design-answer`；音标状态另有 `phonetics-highlight/error/success/placeholder/card`。dark 均按已读Figma注册，light 使用已有语义表面、品牌和状态色回退，不改变其他消费者默认值或把演示状态色视为正式判题。

- 单词六模式局部设置栏归`pages/practice`，复用共享Select/Switch的practice显式密度和`practice-control-surface/text/accent`双主题token。模式配置、截图初值和局部状态独立于七Tab全局学习偏好，现按第29节统一独立缓存；图片/中文/音标显隐接现有题面，排序、中英方式、音节/自然拼读、默写/抄写和切读只做选择演示。全部模式现共用真实用时计时，从零开始，暂停冻结、继续累计，切题保留、重置 / 切换模式重新开始，退出清理；不持久化或生成学习记录。无新增业务请求或真实判题；原稿几何见练习开发文档第21节，计时行为见第37节。

- 练习句子局部设置：`pages/practice`以页面私有配置和`SentencePracticeToolbar`实现七模式左上栏；阅读仅固定示例计时，其余与单词共用页内浮层/分段及共享开关。图片/翻译接既有可见性入口，完整/拆分、抄写和切读只选择，不引入拆句、判题、音源或请求；局部值按第29节独立缓存，原稿几何见练习开发文档第22节。

- 练习音频局部设置：`pages/practice`以独立`audio-toolbar-options`和`AudioPracticeToolbar`提供七模式左上栏，所有音频模式均无完整/拆分，底部无掌握/不熟；阅读仅固定示例计时。页面私有`PracticeModeToolbar`复用行渲染，`PracticeToolbarControls`提供计时/浮层/分段，句子薄适配入口与既有配置契约不变。图片仅控制封面、保留技术播放器；翻译仅覆盖音频中译英/口语/拼块的整句中文，抄写/切读只选择，无新增业务算法、媒体源或请求，局部值按第29节独立缓存。音频题面全量精修未完成，播放器标题提前显示英文仍为既有欠项；原稿几何见[练习开发文档第23节](practice-page-development.md#23-音频七模式左上角局部设置栏2026-10-16)，平板/H5视觉与真机待用户验收。

- 全部左上角设置：`additional-toolbar-options`与`AdditionalPracticeToolbar`补齐视频6、看图4、猜词3、独立指法、音标主画面及四阅读器，保留既有音标内部口语入口。视频全模式移除图片与完整/拆分，答案可见时拼块“拆句”仅切换现有逐词解析与整句显示；猜词键盘只控制既有自定义键盘显示。自然拼读为默认开的四/二阶段朗读计划，音源未接入时不假播。`practiceToolbarOptions`按family:mode保存各自实际可用字段，页面owner校验，shared存unknown；确定首屏、挂载只读恢复、修改后写入、写失败保留本页状态，不复制全局设置或缓存题内进度。实现及验证见练习开发文档第29—30节。

指法虚拟键盘由`pages/practice`私有的`typing-keyboard`、`useTypingKeyboardFeedback`、`TypingKeyboard`和`TypingHands`提供：五行标准键位、彩色键帽、独立半透明双手、原生输入结果驱动目标/实际/错误反馈及可靠修饰状态。键帽只展示，猜词不提示隐藏答案；颜色经app全局语义token。实现与验证边界见[练习开发文档第36节](practice-page-development.md#36-指法虚拟键盘2026-10-16)，平板/H5真机待用户验收。

## 原版反馈动画与声纹（2026-10-19）

features/learning-settings拥有五种LearningAudioWave、7份答对和1份章节完成Lottie注册表与资源，设置和练习仅经根入口复用。shared/lib/animation新增createLottiePlayback、LottiePreview、useAnimationActivity和loadSiriWave，按需加载精确原版依赖，局部实例清理且不改变CSP、路由、存储键或Electron bridge。CI增加settings-effects:smoke实际生产Web/Electron播放与清理专项。
