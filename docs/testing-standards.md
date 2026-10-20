# 测试规范

## 0. 开发期间按影响验证（2026-10-19）

本节为当前开发验证入口，统一下文及团队Skill中的验证要求，并替代旧初始化提示词中每次修改都跑全量测试和构建的要求。按改动的真实影响选择检查，不按修改行数或文件名判定风险；CI门禁、功能断言、设计最终验收及兼容性契约保持，用户对当前任务明确指定的验收范围仍优先。

每次开始实现时只需简短说明验证档位和范围，不为选择档位单独请求确认。一次任务可同时包含多档改动，验证取其真实影响的并集；已通过后没有新改动、失败或未闭合疑点，不扩大或重复测试。

### 0档：仅文档

- 适用：Markdown说明、开发流程、Skill文字等，不改变运行时代码、配置或CI行为。
- 检查本次diff、链接与规范一致性；修改Skill／模块说明时运行对应`lint:ai-skills`／`lint:module-docs`即可。
- 不运行源码全量测试、类型生成、Web或Electron构建；Markdown和静态资源已被Prettier忽略，不为它们运行整仓format。

### A档：局部纯展示

- 适用：已有语义token之间的局部颜色选择、文案、图标、间距、尺寸及静态布局，不改变事件、状态、Props契约、数据、请求、焦点、输入／媒体生命周期或共享默认值。
- 对本次修改的源码／配置做定向Prettier及Oxlint检查，执行`git diff --check`，在现有开发服务查看受影响PC页面／题态及控制台。通常不新增单测，不跑全量test、typecheck、生产build或全模式专项。
- 改颜色检查受影响的深浅主题；改文案检查换行及可访问名称；改布局检查设计基准及一个相关较窄PC状态的遮挡／溢出。仅触及某一已明确断点时按该断点边界检查，不机械重跑所有尺寸、主题和125%／150%／200%缩放矩阵。
- 全局主题token、共享字号、共享布局默认值、Portal／焦点或可能影响拖动和输入的样式不能因“只改颜色／布局”归为A档；升级到B／C档。导入、资源路径或模块边界变化时补相关源码契约检查。

### B档：模式独占行为

- 适用：单模式内部的按钮行为、校验、题态转换、局部算法或缺陷修复，且公共契约和其他模式不变。
- 在A档静态检查基础上，补／改同owner的行为测试，只运行相关单测，并在开发服务验证正常、关键边界及错误／取消路径。纯展示本身不写镜像单测。
- 缺陷修复、解析、状态转换和公式仍须有有意义的回归测试。局部TS类型或调用关系改变时按需要补类型检查；不把开发服务能打开当作完整类型检查。
- 本轮未触及的卡堆、所有输入消费者、整站路由、所有缩放和Web／Electron专项不机械重跑；生产专有行为的专项不得由开发服务检查代替，须在对应交付节点执行。

### C档：公共契约或运行时边界

- 适用：公共组件API／共享默认值、全局token、存储、路由、依赖、构建／CI、SSR／水合、IPC、安全策略，以及跨模式输入／快捷键／媒体／暂停等公共生命周期。
- 先梳理真实消费者，针对本次改变补测试并检查这些消费者；不因为修改了公共文件就自动遍历与它无关的全部40模式或整站路由。
- 公共契约准备交付前，执行下方完整交付门禁；根据实际边界执行生产Web／Electron和兼容性专项。开发中的连续微调先定向验证，稳定后集中完成该交付，不在每次改一处时重新构建。
- 新动态路由、静态资源解析、CSP／protocol、水合或Electron bridge等影响，仍须履行各自契约中的静态产物和真实运行时验证；不能只凭单测通过关闭这些问题。

### 小模式与公共能力交付

练习页在固定工作区的`main`分支、同一窗口内完成开发。一个独立小模式或公共能力准备验收交付时，对本窗口最终代码执行一次：

```bash
pnpm run test
pnpm run build
```

build脚本已包含完整lint、format:check、Next类型生成、TypeScript及静态导出校验，不额外先运行同样的lint／typecheck。需要验证Electron主进程、bridge、协议或桌面构建边界时，改为：

```bash
pnpm run test
pnpm run desktop:build
```

desktop:build已包含Web构建，不能再先跑一遍build。普通文案、颜色和局部布局不要求追加Electron构建；涉及renderer在Electron中的输入／媒体等兼容性时，按真实影响执行对应运行时专项，不把主进程编译当作renderer验收。纯Markdown规则／记录交付按0档，不为文档交付启动源码构建。

同一最终源码或提交的有效验证结果可以复用，不重复运行相同门禁。实现继续变化或其他源码更新影响被测代码时，按变化重验，确保最终交付代码具有有效的完整门禁结果。后续仅修改说明文档可复用原源码结果，但必须明确其提交及差异范围。

模式／设计正式验收仍记录设计基准、受影响状态及所需PC缩放／重排；开发微调只复测受影响性质。平板／H5视觉和真机仍由用户验收，不以几何脚本替代。

### 定向命令与结果记录

以下为已有工具的用法，不引入新的依赖或虚构`test:changed`命令；用实际文件列表替换示例范围：

```bash
pnpm exec prettier --write src/fsd/pages/practice/ui/WordSpellingResult.tsx
pnpm exec oxlint src/fsd/pages/practice/ui/WordSpellingResult.tsx
pnpm exec tsx --import ./scripts/register-static-assets.mjs --test src/fsd/pages/practice/model/word-spelling.test.ts
git diff --check
```

同目录dev／build／typecheck共用Next锁。开发期间保留服务，最终构建时正常停止本目录dev，完成后按需要恢复，不删除活锁。只有明确需要保留本目录服务或隔离生产夹具时才建立验收副本，不为每个展示微调复制工程、生产构建、生成大批截图和逐文件摘要报告。

交付通常只需写三项：本轮实际执行的检查、未执行的检查、待用户验收。失败、未运行和历史证据分别记录，不写“全部通过”；同一最终提交已有有效证据时直接引用，既有失败有已记录且经确认的范围时如实保留，不为微调扩成无关修复。

下文专项描述检查方法和历史范围，按本节触发执行，不代表每个小改动必须运行全部专项。

2026-10-19开发阶段关闭游戏暂停：`practice-pause.test.ts`覆盖默认禁用时手动动作无效、后台挂载和失焦不订阅监听、不冻结计时，并保留显式启用后的状态及资源清理测试。`scripts/practice-pause-runtime-smoke.cjs`默认执行关闭分支，原生窗口失焦/隐藏/后台挂载不能靠前台仿真规避；仍须验证设置等有效浮层的计时阻断和关闭恢复。历史暂停弹窗几何、继续按钮与退场取消检查在开关恢复后重验，当前不得等待已隐藏的暂停入口。并行输入/卡堆专项的旧暂停用例随其任务同步调整，不能据此声称整站全部通过。

整词输入专项入口为`scripts/practice-word-input-runtime-smoke.cjs`，复用隔离生产Web/Electron宿主，检查各文字输入消费者、自然词宽/活动线/独立标点、原生Enter/Tab/选区/替换/退格、点击后词后的Undo/Redo、插入命令拒绝时原文与原生空格路径、暂停恢复及切题清空。真实键盘与DOM注入composition/paste/能力故障分开记录；PC双主题及真实缩放与390/768自动几何分开记录，不将注入事件或移动几何当作真机输入法/软键盘验收。实现边界和实际结果见开发文档“整词输入显示与原生编辑”；普通输入不依赖编辑命令，源码契约fixture拒绝非owner/非insertText/属性提取等越界。

单词拼读专项入口为`scripts/word-pronunciation-runtime-smoke.cjs`，复用隔离生产Web/Electron宿主。`word-card-deck.test.ts`、`card-swap-sequence.test.ts`与`card-swap-gesture.test.ts`覆盖原稿布局、有限题序、首末题、上一题、八方向二维距离/速度及取消边界。速度样本另验证down/move/up、90ms跨窗锚点/插值、停顿旧速度清理、重复及合并样本；生产专项补八方向80px单move、up补坐标及无move释放，不以多move轻甩代替稀疏事件验收。实际渲染直接使用CardSwap组件，生产专项用明确buttons状态的可信CDP指针输入验证慢拖回弹/80px快速轻甩、8×12px单次移动回弹中间帧、角色属性非逐帧重写、惯性、上下/左右/斜向均下一题、拖动中底栏/快捷键接管与迟到pointerup不重复切题、CDP触屏仿真的纵向拖动/旋转（不代表真机）、原DOM卡片持续存在、运动中连续切换、上一题恢复、暂停/浮层取消、末题完成/重练与reduced-motion；pointercancel单独标记为DOM注入。题号在手势接受时更新，取消后保持已选题目且不发生迟到的额外切题；不沿用旧外接Hook的“退场完成才提交”断言。1920×1080/100%核对原卡面尺寸、字体、图标与后卡几何；PC双主题/真实缩放与390/768自动几何分别记录，后者不代表平板/H5视觉或真机通过。结果见开发文档“CardSwap完整组件直接接入”。

退出专项入口为`scripts/practice-exit-runtime-smoke.cjs`，复用panel motion的隔离生产Web/Electron宿主。检查十二内容族共用入口、继续/X/Esc/遮罩保留作答、首个意图生效及退场后导航、合法/非法/缺失课程来源、计时冻结/恢复、媒体位置保留且不自动播放、真实失焦暂停兼容、焦点循环和reduced-motion。1920×1080/100%测量580×414居中外框、原稿卡片/文字/六份素材和280×44按钮；双主题、较窄PC和真实125%/150%/200%页面缩放单独验收。运行方式沿用下述暂停专项，仅替换脚本名与独立profile；CSP、资源、控制台和零业务请求断言保持，实际结果记录于开发文档“退出练习弹窗”。平板/H5视觉、触控和真机待用户验收。

暂停专项入口为`scripts/practice-pause-runtime-smoke.cjs`，使用隔离生产Web／Electron宿主和独立profile，覆盖40模式统一入口、原生窗口blur／隐藏visibilitychange、返回手动继续、退场阻断及再失焦取消、X／Esc／Tab／遮罩、原浮层内容、口语冻结、媒体位置及运行中SPA退出后的任务／监听／迟到回调清理。批量模式使用CDP前台仿真及blur事件注入；原生窗口／可见性／后台挂载专项前关闭仿真并真实聚焦，不改写DOM hasFocus／visibilityState，两类结果分别记录。隔离副本经原runner构建，`PREVIEW_PORT=<独立端口> pnpm run preview`启动预览，再以`DESKTOP_SMOKE=1 DESKTOP_SMOKE_USER_DATA=/private/tmp/<隔离profile> SMOKE_WEB_ORIGIN=http://127.0.0.1:<端口> pnpm exec electron scripts/practice-pause-runtime-smoke.cjs`运行。保持原CSP／protocol／sandbox／contextIsolation和严格资源、控制台及零业务请求检查。1920×1080／100%核对470×195弹窗及字体／局部几何，双主题、PC重排和真实125%／150%／200%缩放另验；PC截图人工查看，平板／H5视觉与真机待用户验收。实际结果见开发文档“暂停弹窗与窗口自动暂停”，不以历史计时／动画结果代替。

完成练习的独立入口为`scripts/practice-completion-runtime-smoke.cjs`，复用panel motion生产宿主与隔离profile，输出单独报告。检查演示目录全部40模式的末题结束、当前列表题数、缺失今日时长及下一章禁用；重练/空格、返回/Esc/关闭等待退场，IME/长按不重入，Enter不误跳。1920×1080/100%核对580×368居中外框、207×44按钮、文字计算样式和全部七份原稿素材几何，并分别检查较窄PC、双主题及真实125%/150%/200%页面缩放。无业务请求、资源失败和控制台错误断言保持；执行结果以开发文档“完成练习弹窗”章节为准，平板/H5视觉与真机待用户验收。

练习错误反馈由独立`scripts/practice-error-feedback-runtime-smoke.cjs`检查实际生产Web/Electron：当前题、多选/必填、未发送且保留输入、Data URL截图预览/移除、四种关闭清空、焦点循环与恢复、按键不透传。1920×1080/100%核对686×822外框及文字/字段/操作区几何，另测PC重排、双主题和真实125%/150%/200%缩放，严格资源/CSP/控制台及零上传请求断言保持。脚本与源码落盘不代表已运行通过，实际结果记录于练习开发文档“导航错误反馈弹窗”章节；平板/H5视觉与真机待用户验收。

测试按模块能力与可验证行为组织，不按页面数量组织。

## 1. 归属

测试与被测概念就近放置：

```text
entities/course/
├── api/
│   ├── parse-course.ts
│   └── parse-course.test.ts
└── model/
    ├── course-progress.ts
    └── course-progress.test.ts
```

一个测试文件验证一个可命名概念。测试公开输入、输出、状态与用户可观察行为，不测试私有变量、Tailwind class 或实现顺序。

## 2. 必须测试

- API 外部数据校验和 DTO 到领域模型转换；
- 状态转换、权限判断、提交参数构造和错误映射；
- 学习进度、积分、复习调度等领域公式及其单位、边界、精度与舍入；
- 可复用 shared 能力；
- 已确认的兼容性降级、清理或恢复；
- 缺陷修复的复现路径。

纯路由组合、静态壳层和无逻辑视觉页面通常不写单元测试。

## 3. 当前能力

`pnpm run test` 使用 Node 的 TypeScript runner 执行 `src/**/*.test.ts` 与 `electron/**/*.test.ts`，并执行环境、资源及源码契约脚本测试。部分 UI 公共契约使用静态 React 渲染验证；生产交互由下述 `runtime:smoke` 覆盖，完整业务 DOM/E2E 在需求明确后补充。

## 4. 写法

- 测试名称描述行为与条件。
- 正常、边界、失败路径放在同一概念文件中。
- 不依赖执行顺序，不共享可变全局状态。
- 外部时间、随机数、浏览器状态通过明确输入或能力边界隔离。
- 不用源码字符串扫描代替行为测试；架构/lint 规则可使用静态检查。

## 5. 完整交付门禁

接口接入或加载行为变更按[接口能力边界](api-capability-boundaries.md#验证证据)验证缺失字段处理、请求来源与次数。使用受控请求替身覆盖缺项不触发未授权补全、列表不产生逐条详情请求、复用组件不引入无关请求或状态写入。按已确认的触发条件断言，不机械规定全页面只允许一次请求；已有分页、详情查看等合法请求保持需求约定。没有真实联调环境时明确说明证据范围。

```bash
pnpm run test
pnpm run build
```

执行时机及例外以第0节为准。build已包含lint和format:check，需要Electron构建时使用desktop:build替代build；不要求开发期每次微调运行此完整门禁。浏览器与设备体验无法由当前测试覆盖时，在交接中列出实际复测视口与未复测项。Codex 的人工视觉验收只覆盖 PC（优先任务指定的桌面尺寸，未指定时为 1440×900）；平板与 H5 的视觉、横竖屏和真机兼容统一列为待用户验收，不得记为已通过。

## Next 与 FSD 运行时契约

- Next 16.3.6 / Turbopack 是唯一框架入口，`output: 'export'`、`trailingSlash: true`；不运行 Next Server，不使用 API Route、Server Action、cookies/headers 或按请求渲染。
- 六层业务位于 `src/fsd`；`src/app` 只放 Next 路由、layout、Metadata 和错误边界。FSD 不反向导入适配层。
- Server page 只 await params 并传序列化 ID/字符串。路径构造回调在 `src/fsd/app/router` Client 装配。跨 slice 使用根 index；混合公共入口不加 use client；枚举器不得依赖浏览器。
- Client Component 仍参与预渲染；首次渲染禁止读取浏览器存储/视口或使用随机值。偏好、Portal 和动画在挂载后恢复。`useSearchParams` 放在最近的 Suspense 边界下，视图 replace 保留其他查询参数并使用 scroll:false。
- 图片导入在 owner 内转换为 `.src`，保持 UI/model 的 string URL 契约。主题首次绘制脚本由 shared/theme 与 shared/lib/storage 生成；仅 html 的主题属性允许窄范围 hydration warning 抑制。
- 根 tsconfig 保持 strict 与 Next 类型生成；Electron 用独立 tsconfig。新路由同步枚举测试、静态产物集合和部署文档。
- 类型、文件断言与真实水合/导航验收分开记录。Tablet/H5 视觉和真机仍待用户验收。

## Production 运行时冒烟

练习弹窗动画专项沿独立`scripts/practice-panel-motion-runtime-smoke.cjs`入口运行（构建、独立预览、profile环境与下述草稿专项相同，只替换脚本名）。原草稿/答案检查保留，`practice-dialog-motion-runtime-checks.cjs`另覆盖居中窗口、六族模式、嵌套颜色/快捷键、局部设置浮层、快速反向、关闭画面保持、Esc/真实遮罩鼠标、焦点恢复、退场后开始/返回、reduced-motion静态及动态切换、双主题和课程默认消费者。检查中间帧与最终卸载，不能只等打开状态或以document.getAnimations代替GSAP完成条件。产物为dist/practice-panel-motion-runtime-validation.json和practice-dialog-motion双端报告/PC截图；平板/H5视觉与真机待用户验收。没有在本专项中遍历整站，不能用它替代完整runtime:smoke结论。

章节草稿专项为`scripts/practice-draft-runtime-smoke.cjs`，可独立执行以避免与底栏的总runner编辑冲突。先在隔离副本通过`pnpm run build`、`pnpm run desktop:build:main`，再以`PREVIEW_PORT=64183 pnpm run preview`启动独立预览；用新的独立临时profile运行`DESKTOP_SMOKE=1 DESKTOP_SMOKE_USER_DATA=/private/tmp/<独立目录> SMOKE_WEB_ORIGIN=http://127.0.0.1:64183 pnpm exec electron scripts/practice-draft-runtime-smoke.cjs`。入口校验隔离环境，读取真实宿主并分别跑Electron/Web，不把Node文件检查冒充renderer验收，也不占用dev锁。报告为dist/practice-draft-runtime-validation.json及双端子报告，4张截图区分深浅主题；覆盖几何、真实拖动/页面缩放、章节范围/编辑/清空/保存、非模态Tab/Esc和媒体连续性。无接口、业务/权限请求均应为0。平板/H5真机待用户验收，范围见[开发文档33](practice-page-development.md#33-章节共用草稿浮窗2026-10-16)。

单词左上角工具栏由`word-toolbar-runtime-smoke.cjs`接入同一Web/Electron生产冒烟：六模式行序/空缓存初值、可见开关、菜单互斥、原生键盘选择、外点/Esc/Tab焦点、设置往返与切题保留、换模式及真实刷新恢复各自缓存；1920×1080/100%读取84×26计时卡、26×26入口、64px浮层及24px行、文字和开关几何，并检查文字单行/不省略、深浅主题、1280/1440/2560与真实1.25/1.5/2页面缩放。报告与截图为dist/word-toolbar-*；零业务/麦克风请求仍必须通过。Electron自动化Enter需按原生输入序列发送keydown/char/keyup，只发keydown/up不能证明原生按钮不可操作。平板/H5视觉及真机仍待用户验收。

工具栏生命周期以[开发文档第29—30节](practice-page-development.md#29-左上角设置最新确认与独立本地缓存实现2026-10-16)的`family:mode`独立本地缓存为当前规则；原单词/句子/音频报告中的“换模式或刷新恢复初值”仅保留为历史实施证据，不再作为新专项断言。只有无有效缓存时才断言截图初值，缓存命中时断言各自已保存值，且恢复过程不能产生写入或清空其他作用域。

设计任务另按[ADR 0018](decisions/0018-reference-fidelity-and-responsive-reflow.md)分两段验收：基准CSS视口/100%缩放下读取字号、行高、字重、字距、实际文字间距、控件尺寸及DOM位置并与Figma逐项比较，保存截图；再检查较窄/超宽PC、真实125%/150%/200%浏览器页面缩放的重排、焦点和溢出。缩小viewport只证明对应布局分支，不能冒充真实页面缩放测试；源码/class断言也不能代替计算样式。H5/平板只做布局计算检查时须明确区分，视觉与真机仍待用户验收。已确认字体回退和真实数据与设计占位的差异单列。

设置页与练习页测试维护当前实现；练习阶段/设置门控、媒体与反馈、设计差异和本轮实际结果见 [练习页开发文档第17节](practice-page-development.md#17-第一版实施记录与下一步2026-10-15)，不以文档整理代替真实运行验收。持久化、校验和预览的技术边界见 [设置功能说明](../src/fsd/features/learning-settings/README.md)。

PK首页增加轮播选择、房号筛选/无结果/清空、榜单指标、取消后我的创建与大厅同步、重新进入恢复示例，以及入口未开放提示。Web/Electron各访问29条路由代表实例，使用隔离测试配置，避免覆盖用户本机偏好。PC截图保存在被忽略的dist/settings-web-pc.png、dist/settings-electron-pc.png及dist/pk-web-pc.png、dist/pk-electron-pc.png。平板/H5仍待用户验收。

生产冒烟每次使用独立临时 Electron userData，退出后由 runner 清理，避免测试偏好影响用户或后续运行。页面和截图统一中文，不再操作语言选择器；隔离配置中注入旧英文存储值后刷新，验证界面仍保持中文、语言入口不存在且控制台无水合错误。

完成双环境构建后运行 `pnpm run runtime:smoke`。脚本自动启动严格静态预览和 Electron hidden sandbox 窗口，加载实际 host/preload/protocol，分别遍历29条路由的代表实例，并验证水合、query、父级返回、壳层滚动与前进/返回、AI场景草稿/内部滚动及离开重置、主题及学习设置持久化、PK大厅本地交互、IPC、未知页面和资源/API 404。结果写入被忽略的 dist/runtime-smoke.json。CI Linux使用xvfb，干净安装还需批准 Electron 二进制安装脚本；真实PC人工视觉仍单独核对。不得用 Node 静态渲染或文件匹配代替该命令。

Node 测试与枚举阶段使用 `scripts/register-static-assets.mjs` 确认资源存在并提供静态导入对象形状；它不证明图片可渲染。真实生产导出和运行时检查仍负责 asset URL 与图片加载验收。

登录前端改版由login-runtime-smoke.cjs接入同一runtime:smoke，Web/Electron均实测五种登录、三种注册、字段错误、密码显隐/账号清空、协议勾选、未接入反馈、查询直达/刷新、资源加载、无认证请求。1920×1080读取卡片/字段/文字/按钮几何与mask合成属性；1280/1440/2560重排及真实1.25/1.5/2页面缩放、light主题读取计算样式。仅使用隔离测试profile和明确示例输入，通知alert在测试窗口内替身记录，正式代码不替换notification。结果dist/login-validation.json，截图dist/login-web-*、login-electron-*；H5/平板视觉及真机仍待用户验收。

首页进入流程新增隔离生产冒烟：未确认定位不启动后续、打卡X/遮罩/Escape不可关闭、单按钮焦点循环、同日去重、跨日、刷新恢复、俱乐部三关闭路径、否与关闭确认不永久隐藏、是持久化且不影响次日签到；读取三窗PC几何并捕获深浅主题，H5/平板待用户验收。

登录模拟的零账号请求检查使用独立未访问过业务页的窗口；仅排除明确属于其他窗口的请求，未知来源仍计入。避免把前序业务页残留加载误归为登录行为，不按路径白名单放行账号请求，保留零请求断言及整体严格资源检查。

登录冒烟区分同协议/同host的GET导出页面资源与账号请求，并记录pageRequests；englishlearning协议的URL.origin为null，不能与完整应用地址比较。login-request-kind.test覆盖HTTP/Electron及POST、API、外站和未导出路径，后四者不作为页面请求排除；零账号请求断言保持不变。

Next16.3.6静态导出的segment-cache/cache.js会先HEAD目标HTML验证路由，再取RSC片段；同协议/host且在CSP产物清单中的GET/HEAD页面资源计入pageRequests，API、POST、外站、未导出路径仍进入账号请求检查。Electron origin仍按protocol/host判断。

PK两个全屏状态页新增冒烟：大厅三个入口、邀请/机器人提示及关闭、取消对话框撤销/确认不删除房间、开启加载、无壳层、72%轨道/文案/ARIA一致、停留不进入练习、浏览器返回与静态直达/刷新。

路由冒烟先等待当前图片加载结束，再断言naturalWidth及资源状态；readyState=complete不代表水合后插入的图片已完成。等待不忽略失败图片，最终零尺寸与404仍阻断。

练习P0新增`practice-runtime-smoke.cjs`并接入总冒烟，读取实际生产Web/Electron页面，覆盖目录/非法查询/模式切换、完整设置往返保留输入、隐藏答案、默写藏图、首题口语重置、技术音视频实际事件及清理、零业务/麦克风请求。记录1920px已核实槽位、字号/行高/字重/字距与PC缩放重排；截图dist/practice-web-pc.png、practice-electron-pc.png及带模式名/浅色主题的分图。截图等待字体、图片解码、合成帧及有限主题过渡，避免DOM断言已更新但捕获旧画面；不等待无限装饰动画。断点回归直接断言1920px自查英语40px与纯白角色色，音标阶段门控另有父组件SSR回归。技术片段不是课程资源；通过这些检查不等于全部设计画板已精准还原，平板/H5待用户验收。

单词章节入口由`word-mode-runtime-smoke.cjs`覆盖六套独立插图、开始导航、关闭/取消/Esc草稿隔离及焦点恢复、来源返回、练习取消保留本轮及确认换模式清理。原14张截图为dist/word-mode-*-pc.png，第18节报告保留当轮仅第2章接通的历史，不作为当前章节门控。

六族入口新增`practice-modes-runtime-smoke.cjs`，接入同一总冒烟的`practiceModes`记录。两端逐项覆盖新增五族27项、句子第4章复用、6类直达和13章可点击/11个VIP标记；验证开始前只预览、取消/关闭/Esc恢复默认和焦点、练习取消保留输入/阶段/题号、同模式不重挂、换模式清理与查询来源保留。1920×1080/100%读取各族不同外框/位置、列表/预览/操作区几何和计算字号；区分原图自然尺寸与515×315 CSS显示槽。检查两主题、1280/1440/2560px PC重排及真实1.25/1.5/2页面缩放；高窗与看图偏移均设代表用例。新增截图40张（每端两主题×五族×首末项）。原稿QA导出位于dist/design-reference，仅作设计证据，不作为实现截图或生产素材。

课程章节按钮存在于SSR HTML，不能以其存在判定事件已挂载；测试先用可逆的本地收藏状态变化确认交互就绪并还原，不重试被验收的章节导航。设置主题切换须等待原生单选框可用，不能只等待其存在；失败记录实际URL、练习顶栏、选择窗和错误提示，便于区分页面与测试就绪问题。

总冒烟当前时限720秒，涵盖逐项导航、素材解码、工具栏双主题/真实缩放、缓存恢复与故障检查；各单步等待仍有界，严格资源与其他失败断言不放宽。业务/麦克风请求必须为零，不把基础弹窗Esc算作练习按键实现；历史模式入口结果见[开发文档20.4](practice-page-development.md#204-验证与下一步)，当前工具栏与缓存验证见第30节。

句子左上角设置由`sentence-toolbar-runtime-smoke.cjs`接入同一生产Web/Electron冒烟：七模式行序/空缓存初值、阅读仅计时、图片/翻译显隐、拆分/抄写不提前泄露答案、浮层与完整设置/切题保留、换模式及真实刷新恢复该模式缓存、Esc/Tab/外点焦点；1920×1080/100%及深浅主题核对计时、按钮、64px浮层和24px行，另验PC重排和真实页面缩放。单词专项额外验证下拉移动底色与音标唯一绿色边框的初始落点、滑动中间状态、快速重选、重排与reduced-motion。报告为dist/sentence-toolbar-*及word-toolbar-*；保留零业务请求/权限请求与严格资源/控制台检查。PC证据不替代平板/H5视觉和真机验收。

强制刷新场景需保留真实资源完成顺序：工具栏主题切换在返回前等待当前body图片成功加载；settingsFlow的测试刷新在本窗图片/RSC等在途请求完成后再执行，并保持有界等待和全部资源失败断言。DOM主题属性或Tab已更新不等于其异步资源已加载，不通过过滤net::ERR_FAILED掩盖测试抢先离页。

音频左上角设置的模型/SSR/题面测试覆盖七模式独立行序与初值、任何模式均无split字段/选项、阅读仅计时、确定预渲染零存储访问、局部翻译仅作用于中译英/口语/拼块并隔离其他族及纯音频阅读器、封面关闭后仍有技术播放器，以及抄写选择不改变既有输入/解析阶段门控。SSR保留audio元素只证明该渲染输出，不能代替真实交互中同一媒体DOM实例不重挂、播放位置及音源不变的检查；不能由这些测试推导“完全无英文答案泄露”，播放器既有title欠项仍保留。原音频交付命令、计数及完成边界见[开发文档23.4](practice-page-development.md#234-本轮验证记录)，当前缓存实现与最终验证见第30节。

`audio-toolbar-runtime-smoke.cjs`接入同一严格静态Web/Electron总冒烟，检查七模式均无完整/拆分及底部掌握/不熟、阅读无设置入口、行序/空缓存初值、封面与中文显隐、媒体实例与技术音源保留、copy不追加旧抄写提示、切题/完整设置往返保留、换模式及真实刷新恢复该模式缓存、Esc/Tab/外点焦点。六个带设置模式在真实播放中逐项双向切换，检查同一DOM和音源、音量/倍速保持、仍在播放且无额外loadstart/emptied/pause；技术WAV在隔离测试中静音循环，检查结束还原。1920×1080 CSS视口/100%下读取计时、按钮、64px浮层/24px行及文字计算样式，并分别检查深浅主题、PC重排与真实125%/150%/200%页面缩放；原稿未核实的20/18/14px行高只能记为实现值。第23.4节历史完整总冒烟58次路由访问通过，报告dist/audio-toolbar-runtime-validation.json与audio-toolbar-{web,electron}-validation.json，42张音频PC截图；这些历史结果不证明新缓存已经通过生产验证。严格资源/控制台失败断言与零业务请求/权限请求要求保持，平板/H5视觉及真机待用户验收。

## 工具栏独立缓存与新增内容族验证

`additional-toolbar-runtime-smoke.cjs`接入同一生产总冒烟，覆盖视频6、看图4、猜词3、独立指法1、音标1及四类阅读器4，共19个主要模式；音标内部口语配置由模型/SSR继续覆盖，不计入19个主画面。按实际可用项检查仅计时/常驻开关/浮层行序与初值、普通开关及分段操作、外点/Esc/Tab、深浅主题、PC重排和真实1.25/1.5/2页面缩放；视频拆句只在`revealed`/`correct`出现，缓存不越过题态，开关不更换媒体实例或source。猜词键盘hidden后重开应保留目标键与答案输入；音标只切换四/两阶段朗读计划，不隐藏音素格或在缺音源时假播。

基准几何须包含视频/看图沉浸听力的84×26计时卡@(29,92)例外，其余本轮模式@(16,95)；音标常驻plate为88×26@(110,95)、与计时卡间距10px。其他有设置模式沿26×26入口、12px间距、64px浮层/24px行。原稿未返回明确line-height的20/18/14px仅记录为当前实现值；实际计算样式、截图和最终结果见[开发文档第30节](practice-page-development.md#30-其余内容族工具栏与全族局部缓存实施2026-10-16)，不能以SSR或class断言代替PC几何验收。

缓存验证使用实际owner的版本1数据结构与独立登记键`english-learning-practice-toolbar-options-v1`。在同一隔离应用上下文中备份工具栏键，空fixture验证初值，再逐作用域编辑、切题、重置、完整设置往返、换模式/内容族并真实刷新，检查`family:mode`隔离及其他作用域不被覆盖。SSR和冷启动恢复须证明读取发生在挂载后，恢复过程只读且未以默认值覆盖缓存，ready前原生控件不可操作；编辑后才允许写入。仅计时作用域不新增缓存，输入/词块/题号/媒体状态等非设置字段不得写入。

存储故障注入须分别覆盖读取拒绝和写入失败：出现失败反馈后，本页选择与其他模式的未存修改继续保留；存储恢复后触发下一次合法编辑，检查pending作用域合并补存且已有其他作用域未丢失。缓存坏值/未知字段/未知版本由模型测试验证回退与白名单，不用模拟成功结果替代真实生产读取和刷新。单独移除工具栏键不得影响`learningPreferences`、主题或背景图；shared项目清理的登记范围另有单元测试。

每个fixture在finally还原原工具栏键及注入的存储方法，媒体静音/循环设置也须恢复；只在隔离profile中操作，不清空整个Storage，不改用户日常配置。导航/刷新前等待本窗图片和在途资源完成，保持有界等待、全部严格资源失败及零业务/权限请求断言。脚本新增或语法检查不等于运行成功；最终生产Web/Electron报告、实际模式数量、故障注入、PC人工截图与真实缩放结果须在执行后补录，平板/H5视觉和真机仍待用户验收。

## 练习右上导航按内容族裁剪

`practice-navigation-runtime-smoke.cjs`接入同一Web/Electron总冒烟，使用独立于生产导航配置的四组需求预期，逐一访问12种内容族的40个合法`demo/mode`组合（包含音标内部口语），核对按钮精确顺序、应隐藏项、同一内容族全部子模式一致、可访问名称、可见性、键盘可聚焦及pointer光标。单词/句子/音频/视频/看图为九项完整导航；独立指法/音标为内容、暂停、重置、草稿、设置、全屏；猜词为答案、模式、重置、草稿、设置、全屏；四阅读器仅草稿、设置、全屏。不得为测试重新开放已移除的入口；需要跨模式或目录导航时使用该内容族真实可用入口或显式演示目录路径。

每端保存12族深浅主题共24张右上导航局部截图，报告为`dist/practice-navigation-{web,electron}-validation.json`，汇总在总报告`practiceNavigation`字段。1920×1080 CSS内容视口/100%下检查header高72px；完整导航宽752px、独立指法/音标/猜词宽482px、阅读器宽212px，以header实际可用右缘检查普通族右12px、猜词/阅读器右10px。报告同时记录innerWidth、documentElement.clientWidth与经典滚动条宽度；不得把含滚动条的窗口宽度直接当作header可用宽度，也不通过隐藏滚动条或修改生产CSS凑绝对坐标。普通按钮74px宽、当前实现28px高/y22、14px/20px/400、18px图标与内部间距5px；全屏30×30/y21，导航间距16px、全屏前18px。普通按钮28px高度及20px行高来自原稿内部几何与布局推导，属于当前实现和计算样式验收值，不能表述为Figma直接返回的高度/行高。四组结构代表另检查1280/1440/2560px PC重排与真实125%/150%/200%缩放。

四组结构代表复用已有答案、内容、暂停、重置、报错、模式、草稿及完整设置的实际入口，验证关闭回到同一页面、草稿本轮重开保留、七Tab完整设置可访问及操作前后导航裁剪不变化；不重复全部内容族的长业务流程，不新增保存请求或学习算法。全屏入口验证存在、语义和几何，隐藏自动化窗口不作为真实全屏兼容证据。专项使用有界等待，切页前等待当前图片及本窗在途资源，不覆盖全局资源失败监听；保留零业务请求、零权限请求、零控制台/资源异常断言，以及原媒体和缓存故障恢复路径。脚本落盘和静态检查不代表生产运行通过，实际结果在执行后记录；平板/H5视觉与真机仍待用户验收。

指法虚拟键盘新增`scripts/typing-keyboard-runtime-smoke.cjs`独立生产专项，复用隔离Web/Electron宿主；测试五行特殊键、原生字符/删除/替换/多字符提交、IME事件序列、修饰状态、重置/切题/阻断/猜词隐藏及PC几何/双主题/真实页面缩放。多字符insertText只证明粘贴等效结果映射，不声称系统Ctrl/Meta+V或真实IME候选窗通过；右Shift硬件与系统软键盘按实际宿主证据记录，平板/H5真机仍待用户验收。报告与本轮实际执行结果见练习开发文档第36节。


## 单词与句子内容弹窗专项

`scripts/practice-content-runtime-smoke.cjs`为独立生产专项，不改其他练习任务的总runner。隔离副本执行`pnpm run build`、`pnpm run desktop:build:main`，用独立端口`pnpm run preview`，然后以`DESKTOP_SMOKE=1 DESKTOP_SMOKE_USER_DATA=/private/tmp/<独立目录> SMOKE_WEB_ORIGIN=http://127.0.0.1:<独立端口> pnpm exec electron scripts/practice-content-runtime-smoke.cjs`运行。仅使用独立profile，保持真实Electron协议/preload及Web严格静态CSP、资源失败和零业务/权限请求断言。覆盖单词6、句子7模式的默认中文及英/双语、切题/当前题关闭、X/Esc/真实遮罩关闭与焦点、原生Enter/Tab、5个其他内容族不变、24px资源实际几何及双主题PC/真实125%/150%/200%缩放。报告`dist/practice-content-runtime-validation.json`和双端子报告，截图区分默认中文与双语。长列表用60题真实组件SSR及生产DOM临时扩容布局检查，正式题库仍是两条本地示例，不伪装为真实接口或性能验收；详见练习开发文档“单词与句子内容弹窗”。平板/H5视觉、触控及真机仍待用户验收。


内容弹窗专项默认以真实前台窗口遵守失焦自动暂停，完成后隐藏；若用户继续操作电脑，可显式设置SMOKE_CONTENT_ACTIVE_FIXTURE=1，仅在隔离测试文档中固定active条件，防止原生失焦打断内容检查。该模式不作为原生焦点/后台暂停验收，不修改生产暂停代码，并由实际可见浏览器独立复核居中。截图前在该测试窗口做1px原生resize并恢复，以避免隐藏宿主连续开关时只复制脏区；最终计算几何和截图保持目标CSS视口。真实后台暂停流程由对应专项验收。

## 原版设置动画与声纹专项

2026-10-19移除全部“演示状态”产品面板后，答对/答错/未开放答案态由`PracticeContent.test.ts`显式SSR夹具及模型/反馈控制器测试覆盖。生产脚本不得通过隐藏业务入口强制判题；`settings-effects:smoke`验证7份设置预览真实帧和偏好、五种声纹、真实章节完成及媒体生命周期，答对事件页面实播待正式判题接入。工具栏原生summary焦点检查用脚本自建原生控件夹具，随页面销毁。弹层几何先等待可见、opacity为1且transform归零，保持原设计断言，不以入场中间帧替代最终布局。

pnpm run settings-effects:smoke复用run-runtime-smoke的严格生产预览、真实Electron主机和独立profile，不触碰开发锁。独立settings-effects-runtime-smoke.cjs检查8份Lottie实际SVG帧、7项原生单选/保存恢复、五种声纹真实动态帧、两个设置值消费、演示录音与实际媒体playing/pause、完成窗口循环、暂停/关闭/离页清理、reduced-motion、双主题及真实125%/150%/200%页面缩放。资源/CSP/控制台和业务/权限请求保持严格断言；PC1440×900/100%人工查看，平板/H5只做几何检查并留待用户视觉真机验收。实际执行结果在练习开发文档记录，脚本与CI接线不代表已经运行通过。

课程封面动效专项入口为`scripts/tilted-cover-runtime-smoke.cjs`，复用隔离生产Web/Electron宿主，验证全部封面入口、可信鼠标移动、稳定槽位、方向/光泽、离开与失焦复位、动态reduced-motion、触控事件不启动动效，以及原链接/播放/收藏编辑/PK课程单选。Node相邻单测覆盖几何与帧取消/卸载；生产结果写入`dist/tilted-cover-runtime-validation.json`。基准1440×900及1920×1080/100%检查dark/light，并另查PC宽度和真实页面缩放；平板/H5视觉和真机仍待用户验收。运行方式沿用上述独立生产专项，仅替换脚本名并使用独立profile。


## 句子沉浸听力公共前置专项

练习公共专项scripts/practice-sentence-listening-runtime-smoke.cjs，使用已构建的真实Electron主机／preload／englishlearning协议与严格生产Web预览，独立profile，命令沿既有独立专项方式替换脚本名。检查1920×1080/100%六行标注／图／中文／笔记／口语几何、两份原素材尺寸、固定配色与亮度分层、独立偏好、原生笔记和口语按钮／V、相关默认消费者以及双主题PC宽度／真实页面缩放。长词为明确的临时DOM布局夹具，390/768为自动几何，均不冒称真机输入验收；不为复用本专项恢复暂停。听力split历史行及对应预期待清理，旧缓存过滤、图片／切读恢复和其他模式split保留在后续交付时基于真实rows重验。结果和边界见练习总文档“句子沉浸听力公共前置”，平板/H5视觉及真机待用户验收。

## word:spell 公共依赖专项（2026-10-20）

入口scripts/practice-word-spell-public-runtime-smoke.cjs复用既有严格生产Web／Electron宿主，使用本工作区dist内的独立DESKTOP_SMOKE_USER_DATA与SMOKE_WEB_ORIGIN预览。包含答案／草稿动画子检查、Portal／模态层级、仅拼写输入聚焦命令及普通编辑器隔离、反馈分段／UTF-16／Undo／Redo和PC重排／真实缩放。scripts/practice-word-input-fixture.cjs及loader仅打包实际React组件供隔离宿主挂载，不新增产品路由，不模拟公共输入DOM，也不实现单词比较。显式反馈夹具、DOM选区／IME／粘贴注入、真实Chromium键盘及OS真机证据分别记录；其他输入消费者继续运行practice-word-input-runtime-smoke.cjs。build含lint；生产renderer专项需要时只追加desktop:build:main，不重复Web构建。

practice-panel-motion-runtime-smoke.cjs另导出runPracticePanelMotionChecks供本轮专项复用，原总入口不变。2026-10-20扩展旧总专项在学习内容关闭按钮历史选择器失败；本轮只将独立通过的答案／草稿子检查计入公共交付，不将旧总专项或全站runtime:smoke记为通过。最终执行证据与限制见练习总文档对应章节。
