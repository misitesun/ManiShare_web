# 单词游戏开发记录

## 职责与入口

分支`codex/word-games`，Web端口3001。先读[练习页总开发文档](practice-page-development.md#当前进度与三窗口协作入口2026-10-19)的当前进度、文件归属与交付流程；本文件由单词窗口维护，总文档和练习README由主窗口在集成时汇总。

独占实现仍在`src/fsd/pages/practice`，不新增平行page slice。`PracticePage`／`PracticeContent`、演示题库、词槽输入、底栏、快捷键、偏好、全局样式及共享UI均是主窗口文件；需要修改时，先交主窗口完成公共契约和接线，再同步`main`。

## 基线进度（2026-10-19）

- `pronounce`单词拼读：10词，四层3D卡堆、手势、记住移除、再来队尾及重练已实现，记录仅本轮内存。
- `spell`单词拼写：12题本地比对、固定词槽、提交／重试、本轮统计、正确态口语入口已实现；正式服务端判题和真实口语仍未接。
- `dictate`单词默写、`meaning`句中练义、`typing`指法、`oral`口语：基础组合及工具栏已有，继续按后续精确设计逐项评估，不记为全部精修完成。
- 手机音标下拉、极窄工具栏局部横滚、流式卡面已有实现；PC历史专项与真实缩放证据见总文档。平板／H5视觉、触摸、软键盘、输入法和真机待用户验收。
- 暂停当前统一停用；正式音源、声音特效迁入、接口和跨会话记住记录不属于已完成能力。

## 每次独立交付的记录要求

在下方追加本次小模式记录，保持旧记录的时间与证据范围。至少写明：需求／设计节点与确认范围、小模式与题态、起始主分支提交、公共依赖及主窗口交付提交、独占修改文件、已实现／待办、测试及构建命令和结果、生产运行及PC视觉证据、平板／H5待用户验收项、已知问题、最终被测提交、合并状态。

公共输入专项归主窗口；单词卡堆、记住、工具栏专项可在本分支维护。先确认真实消费者，不根据`Word`文件名前缀判断独占。每个小模式测试并确认后才提交主窗口顺序集成；合并前同步最新`main`并对最终提交重验，下一轮继续同步主分支。

## 后续小模式交付记录

以下记录本分支独立交付；上方基线及总文档中的历史专项不替代本轮实际验证。

## 2026-10-19 单词拼读卡片边框统一

### 确认范围与基线

- 小模式：`word:pronounce`。用户以拖动截图指出前后卡边框不一致，并明确确认统一采用前卡渐变描边和20px基准圆角。
- 起始`main`提交：`f6caa18731aa330bc4c553661417a3793332b0da`（归档练习页实现并建立单词句子并行开发流程）；开始时本工作区干净，与本地`main`无提交差异。
- 公共依赖提交：沿用同一基线，无新增公共需求或主窗口交付提交。复用现有`WordPronunciationCard`、`CardSwap`及前卡SVG；公共Props、页面装配、题库、输入、偏好、全局样式和共享资源沿原入口消费。

### 独占文件与实现

- `src/fsd/pages/practice/ui/WordPronunciationDeck.tsx`：所有真实卡显式传入`borderDepth="front"`，替换按业务题序分配near/far的方式。后卡被拖动露出、切题补位和再来回插时均保留同一SVG及`4% / 4%`裁切；500×500基准对应20px圆角与原1px渐变描边。卡堆深度继续由原3D位姿表达。
- `src/fsd/pages/practice/ui/WordPronunciationDeck.test.ts`：新增3项真实组件预渲染回归，覆盖首／中／末题、再来重排、记住删除、剩2／1张、隐藏图片及自定义字号。旧实现3项均因near资源与front不同而失败，修复后通过；预渲染回调若被执行即失败。
- `scripts/word-pronunciation-runtime-smoke.cjs`：逐卡读取实际描边资源、加载状态与四角计算圆角，在原拖动、回弹、全方向手势、题序、浅色主题、PC窗口／真实缩放和reduced-motion场景断言一致。
- `scripts/card-swap-presentation-runtime-smoke.cjs`：连续再来沿原轨迹逐帧读取全部可见卡的描边与轮廓，另覆盖hover、可信纵拖、上下题、记住及reduced-motion。原几何、同DOM与可见卡数量断言继续执行。
- 文档仅维护本文件。原SVG字节、卡面Props及近／远描边资源、轮廓模型、手势引擎与公共接线保持原实现。

### 实际验证与证据

- 在固定单词工作区运行`pnpm run format`、`pnpm run test`、`pnpm run lint`及`pnpm run desktop:build`全部通过；后者包含`pnpm run build`、路由类型生成、严格TypeScript、275份业务HTML及完整RSC／资源验证和Electron主进程构建。
- 本轮全量测试660项：源码／Electron636项、脚本24项。lint保留共享弹窗既有3条warning。日志位于`dist/word-border/`；未使用历史657项结果代替本轮。
- 构建前核实并正常停止本目录3001 dev runner，随后在同目录／同端口使用`PREVIEW_PORT=3001 pnpm run preview`验收生产产物，结束后正常停止该预览并恢复`pnpm run dev --port 3001`；未删除活锁或操作其他工作区服务。
- 独立四层专项在生产Web与真实Electron协议双端通过，包含四张可见卡、原hover、两次同DOM再来回插的逐帧描边、业务导航、纵拖、无文档溢出、记住和reduced-motion；业务请求、资源失败和renderer控制台告警／错误均为0。
- 完整拼读专项首次Electron端通过；首次Web端在第二个全方向上拖检查读到`returning`而期望`dragging`，边框断言未失败。该次报告与日志保留于`dist/word-border/first-pronunciation/`，未放宽原手势断言。相同产品与脚本、新隔离profile完整重验后，生产Web／Electron双端均通过，每端覆盖15组交互、其余5个单词模式访问、1920×1080基准、深浅主题、1280／1440 PC及真实125%／150%／200%缩放；业务请求、资源失败和renderer控制台告警／错误均为0。首次手势中断原因仍未定位，未将重验通过表述为该问题已修复。
- 专项命令使用`DESKTOP_SMOKE=1`、本工作区`dist/word-border/`内独立`DESKTOP_SMOKE_USER_DATA`及`SMOKE_WEB_ORIGIN=http://localhost:3001`，分别运行`pnpm exec electron scripts/word-pronunciation-runtime-smoke.cjs`与`pnpm exec electron scripts/card-swap-presentation-runtime-smoke.cjs`。隔离宿主前台仿真与CDP触屏不作为原生后台或真机验收。
- PC已人工查看1920×1080／100%的静止、回弹、右拖露出后卡、浅色及真实200%缩放图；原卡面500×500、字号、按钮与3D几何继续由专项逐项核对。较窄PC1440／1280和真实125%／150%／200%缩放另记自动结果；390／768仅自动几何检查。
- 报告：[四层双端汇总](../dist/card-swap-presentation-runtime-validation.json)、[拼读双端汇总](../dist/word-pronunciation-runtime-validation.json)；PC截图：[拖动露出后卡](../dist/word-pronunciation-electron-right-drag.png)、[浅色](../dist/word-pronunciation-electron-light-1920.png)。[被测源码摘要](../dist/word-border/tested-source.json)绑定四份实现／测试／专项文件，产物均在ignored dist。
- 兼容性：已读文本输入和Next静态运行时契约；原生输入、媒体与严格静态CSP沿原入口，未新增接口、存储、主题token、依赖或Electron bridge。本轮未重新运行整站`runtime:smoke`。

### 提交与交接

- 最终被测实现提交：`746c1b97b29dc5ad2ddc1652d18955921413cd7c`（`fix: 统一单词拼读卡片描边与裁切轮廓`）。4份文件与实际测试／构建／生产专项时的SHA-256全部一致；后续交接提交仅补本记录，没有实现或专项变化。
- 合并状态：仅在`codex/word-games`交付，等待用户验收后由主窗口集成；本窗口不合入`main`或推送。
- 待用户验收：平板／H5视觉、触摸手感、横竖屏、OS输入法、系统软键盘、外接键盘与真机兼容；本轮不将自动几何／事件注入视为上述项目通过。
