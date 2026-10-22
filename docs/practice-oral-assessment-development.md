# 口语评测源码审阅与模拟 UI

## 最新同步状态（2026-10-22）

用户确认后，句子口语页面和阅读全览首次朗读已一并定向同步到本地main工作区，共13个相关文件；保留单词和音频游戏改动。main从3000查看句子`oral`和`read`模式，录音／评分及示例回放边界保持。按用户要求未运行测试、lint、类型检查、构建或浏览器验收，未创建Git提交或推送。下方仅句子分支、待查看及未同步描述为此前开发状态，以本段为准。

## 句子口语页面对齐单词（2026-10-22，句子分支待查看）

`sentence:oral`本轮直接复用单词口语四态页面和控制器，默认十条句子与既有本地WAV，传递整句目标及逐词评分；录音开始和四档评分提示、切题／完成音效、切读与手动朗读、结果播放均沿既有装配。`WordOralAssessmentExercise.family`可选`word | sentence`且默认单词，只切换题图与标记；`OralAssessmentContent`页面准备／录音文本统一单词原32／40px、56px行高，句子弹窗仍保留24／30px，不改结果卡和默认单词样式。矮屏整体滚动、固定底栏及长句换行同原页面。

录音／评分仍是单词模式的模拟流程，结果回放临时使用当前句子示例音源，明确不是用户录音；已确认将来回放应改为本次亲录音频的语义不变，缺少正式录音与评分接口契约时不擅自接采集、网络或新字段。真实回放状态由现有`playback`端口、`usePracticeReading`和媒体事件拥有，开始录音或评测暂停朗读，旧题／轮次／阻断清理沿原流程。

修改仅句子worktree，保留阅读全览首次朗读与所有单词／音频改动。3001的`/practice/?demo=sentence-basic&mode=oral`先交用户查看，暂不同步main；更新对应断言但未运行测试、lint、类型检查、构建或浏览器验收，只做定向格式化和静态范围核对，各端真实交互与声音待用户验收。

2026-10-21句子复用：`sentence:listen`现通过同一`OralAssessmentDialog`／`useOralAssessmentDemo`接入准备、录音、评测、结果四态，目标为当前完整句子及`kind='sentence'`，ID包括内容族、模式、题目、重练轮次。点击和V沿现有命令与`canShowQuickOral`设置门控；切题／关闭／重置清理、录音／评级提示音及设置声纹保持公共路径。录音、评分、回放均模拟，缺少课程朗读音源仍提示待接；本轮用户要求不测试，仅格式化及静态差异核对，实际各端效果待验收，详见[句子本轮记录](practice-sentence-games-development.md)。

2026-10-21复用扩展：单词默写答对后的入口改用与拼写相同的`OralAssessmentDialog`／`useOralAssessmentDemo`；页面按`模式:题目:重练轮次`传入目标，入口依旧由`canShowQuickOral`与设置控制。V键、暂停、关闭、切题取消与设置动画沿用现有通用能力，录音／评分／回放全部模拟，不新增麦克风或接口。详见[默写开发记录](practice-word-dictation-development.md)。

图标动效修正：待录音、评测中及结果默认只显示中心圆和图标；录音／模拟回放时显示双层水波向外扩散、淡出，中心保持静止。三处图标共用内部组件，原占位和操作保持不变；暂停、不可见、退出或 reduced-motion 时停止扩散。本次仍只做格式化及静态检查，不运行测试、构建或项目浏览器验证。

2026-10-21。审阅用户指定的本地源码目录 `/Users/sly/Downloads/新哇学社/waxueshe-client-web-main`，不是对远端版本或设备兼容性的验证。用户已确认先全部模拟，再接入单词拼写；没有麦克风授权、真实录音、真实回放或评分请求。

## 哇学社：入口和打开弹窗

- `src/game/components/Botbar.vue` 根据 `answer_success_oral_show` 与答题成功状态展示快捷评测入口；听力等模式另有分支。不能简单把“当前是最后一题”或“已提交”当成入口条件。
- `src/game/components/Oral.vue` 负责弹窗、重置 recording store、分离 visualizer、暂停／恢复游戏。首次操作打开弹窗，不立即开始采集。原项目使用 Enter；本项目按已确认方案使用 V。
- `hideTrigger` 场景只有弹窗已经打开才响应 Enter，避免劫持题面快捷键。请求权限中、评测中拒绝重复操作；已出结果则进入重录。退出会复位录音上下文并恢复原游戏状态。

## 哇学社：开始和结束录音

`src/game/components/Content/Oral/Ready.vue` 的 `startRecording`：

1. 重置录音数据，进入 Requesting。部分正式模式先检查录音收集确认。
2. 先 `prepareMicrophone`，再加载评分配置，保留浏览器用户操作触发链。
3. 非音标、非 Firefox、非 LLM 路径准备实时评测会话。
4. 启动 MediaRecorder，检查媒体流；实时路径再启动 PCM 流。
5. 将媒体流交给录音状态和声纹，进入 Recording，播放开始提示音。

`endRecording` 先以 `isStopping` 阻止重复停止，停止 PCM 与声纹，取得实时结果任务及最终录音文件，再进入 Evaluating。根据音标、LLM、实时或整文件上传分支评测；处理结果并保留音频文件，随后进入 Completed。流程使用 attempt／disposed 校验取消过期动作，释放媒体资源前有300ms等待；非 LLM 评分存在超时复位处理。

## 哇学社：结果与回放

- `src/game/components/Content/Oral/Score.vue` 展示逐词评分、总分、等级／评语、准确度、流畅度、完整度；`oralScoreItems.ts` 筛掉接口没有返回的维度。
- 展示色阶按小于60／80／90／其余四段，分数截断至一位并限制范围。评测完成音按 KEEP TRYING／GOOD／EXCELLENT／PERFECT 映射，自动朗读还受设置控制。
- 有本地录音文件才能生成回放 URL，HTMLAudio 处理播放／结束；重录先停止回放，清理结果后重新启动。成功后的 Ready 卸载不提前清空结果所需的文件。

## 哇学社：浏览器适配与释放

- `src/hooks/useMicrophonePermission.ts` 检查安全上下文、媒体能力与权限策略；权限查询不支持时仍可尝试采集。`getUserMedia` 在用户动作链内先调用，再等待其他异步工作。等待授权与设备启动使用不同超时／提示，并区分拒绝、无设备、占用、能力缺失等错误。
- `src/hooks/useAudioRecorder.ts` 通过 `MediaRecorder.isTypeSupported` 探测 WebM/Opus、WebM、MP4、MPEG，必要时交由浏览器默认选择；实时路径在本地 recorder 不可用时可能继续，但此时不能承诺本地回放。停止时等待最后音频块，再关闭轨道，释放或撤销 Object URL。
- `Ready.vue` 与 `src/hooks/useXfyunIseEvaluation.ts` 兼容 AudioContext／webkitAudioContext，恢复 suspended 状态；实时流转16kHz单声道16位PCM，文件上传路径另做解码／重采样。Firefox 在该源码中选择文件上传路径，注释解释为其 WebSocket 压缩兼容处理；这是该项目实现，不能泛化为所有 Firefox 都不支持实时录音。
- 关闭／取消／卸载清理 stream tracks、PCM 回调、AudioContext、visualizer、网络会话、URL、定时器与动画；代次校验停止迟到的授权媒体流或评分结果。设备与浏览器录音兼容需在后续真实接入时另行验收。

## 本项目已实现范围

公共组件为 `src/fsd/features/oral-assessment`，页面从根入口消费，未复制 Vue store、采集协议或接口。单词拼写答对、设置允许显示评测时，点击入口／V打开准备态；点击／V开始，再次操作结束，模拟评测1200ms后展示结果。结果可重录或模拟回放。退出、切题、重置、暂停均清理本轮任务，避免旧结果跨题出现。

页面注入已有录音／朗读声纹设置及静态提示音；组件不横向依赖设置 feature。回放只演示状态和声纹，不生成／播放录音文件。原有其他模式的演示保持原入口，后续按公共目标／控制器接口迁移。

四步 UI 按 Figma [准备态](https://www.figma.com/design/z7SIwUb9ep0j0ZaEwFrxJl?node-id=2450-6907)、[录音态](https://www.figma.com/design/z7SIwUb9ep0j0ZaEwFrxJl?node-id=2450-7017)、[评测态](https://www.figma.com/design/z7SIwUb9ep0j0ZaEwFrxJl?node-id=2450-7131)、[结果态](https://www.figma.com/design/z7SIwUb9ep0j0ZaEwFrxJl?node-id=2450-7241) 的实际属性还原。结果稿采用圆环总分与右侧三指标，未沿用参考项目旧版徽章截图。1920×1080 CSS视口的1220×641弹窗、40px准备态单词、100px主按钮与60px结果按钮均来自属性面板，资源直接导出。

按用户要求未运行测试、类型检查、lint、构建、开发服务器或项目浏览器验证。新增状态回归用例待执行，PC设计基准和交互、平板／H5视觉及真机兼容待用户验收。


## 2026-10-22 页面内评测与弹窗共用

本轮按用户确认方案实现单词`word:oral`页面（入口`/practice/?demo=word-basic&mode=oral`），继续全模拟。布局来自[Figma准备态](https://www.figma.com/design/z7SIwUb9ep0j0ZaEwFrxJl?node-id=546-31837)、[录音态](https://www.figma.com/design/z7SIwUb9ep0j0ZaEwFrxJl?node-id=2046-18716)及四档结果`2064:18873`、`2071:19362`、`2072:19583`、`2072:19802`。已读取六节点完整属性；设计中的录音与结果句子示例不替换当前单词目标。既有图片、麦克风／播放PNG、声纹和提示音继续复用，没有新增业务资源。

影响图为：`PracticePage → WordOralAssessmentExercise → features/oral-assessment.OralAssessmentContent`；原模式入口仍为`PracticePage → OralAssessmentDialog → 同一OralAssessmentContent`。两者共用`useOralAssessmentDemo`与纯模型中的分档函数，页面不创建第二套阶段机。Dialog保留TldDialog、Portal、关闭／ESC、焦点与内部滚动；page只展示正文，不含模态壳或ESC退出按钮，ESC沿练习暂停处理。矮屏滚动整个题图与评测内容，固定底部操作区。

按用户文字区间处理边界：归一化到0–100及一位小数后，≤60红色KEEP TRYING、>60–80橙色GOOD EFFORT、>80–90蓝色GREAT WORK、>90–100绿色PERFECT。设计示例60／80／90的着色与标题区间不一致，因此采用已确认文字规则。逐词分数按各词自身分档，总分环／等级／指标条按总分；机器等级枚举保留原值供提示音消费。dark/light新增专用评分语义token，未改全局danger／accent／success。

页面固定样例40／70／85／96随完成评测与重录循环；既有弹窗默认40分不变。选项`sampleScores`可注入其他固定序列，不按录音时长、输入或随机数推算分数，也不新增设计外调分按钮。计时冻结、1200ms评分、回放状态与取消代次保护沿唯一控制器；暂停／切题／重置／退出和卸载不复活旧结果。原题库两条种子题保持，不增加朗读音源或网络补查；现有朗读／切读缺项沿原入口。

新增模型边界／固定样例循环及取消、共用正文两种展示四态、页面装配与其他内容族隔离用例。按用户约定不运行测试、lint、类型检查、build、开发服务器或项目浏览器；仅定向格式化与静态源码／diff核对。PC设计基准和缩放、平板／H5视觉与真机、Electron均未验收。未提交、未推送Git。


## 2026-10-22 十题与示例朗读回放

用户反馈播放按钮只有声纹没有声音。直接原因是模拟控制器`replay()`仅切换播放标记并按录音计时结束，没有任何媒体播放宿主。现按用户要求把`word:oral`扩为woman、man、girl、boy、book、apple、water、sun、green、happy十个独立题目，沿`oral:`身份与指法分开，复用已有同词WAV，不增加音频文件或联网TTS。

`word-demo-reading.ts`持有唯一十词映射，`getDemoQuestions('word','oral')`填入对应`readingSource`。切读与Shift+A／底栏朗读使用原`usePracticeReading`，并接句子游戏的提示音ended等待器。评测回放通过feature新增可选`OralAssessmentPlayback`端口接入同一播放机制，页面和通用弹窗共用：优先当前题目的音源，单词缺项只匹配十词表；未知目标不发起补查、不拿别的词或技术纯音替代。无端口的演示消费者仍可全模拟。

播放等待提示音／加载时不启动扩散，真实playing才动画，ended／pause／error结束，回放不再按模拟录音秒数截断。等待可取消、失败可重试；录音开始停止朗读，重录／切题／关闭／暂停／隐藏／卸载清理回放及等待，旧visit不能复活播放。录音与评分继续全模拟，回放实际内容是当前题目的示例朗读，不是用户录音；界面保留原按钮位置和布局，辅助说明明确来源。

新增十题音源／缺项、媒体状态映射、真实回放控制／取消与旧状态隔离、共用正文来源说明回归用例，未执行。读取十份现有WAV元数据确认均为22,050Hz／16bit／单声道PCM、有音频帧，结构检查不等于听音或浏览器播放验收。按既有约定不运行测试／lint／类型检查／build／开发服务器／浏览器，仅定向Prettier和静态核对；各端实际播放待用户验收，未提交／推送Git。

## 2026-10-22 用户确认：播放录音应回放本次用户录音

- 页面与共用评测弹窗中的“播放录音”，最终应播放用户自己本次录制的音频；默认单词／句子音源只属于朗读／切读，不能作为最终录音回放内容。
- 目前已有的示例朗读回放仅为临时演示，不表示产品语义已完成。现有界面、声纹和播放代码本轮保持原状。
- 待后续录音／评分接口契约核对完成后，再调整回放来源及重录、切题、关闭时的关联和清理；不预设录音字段、地址或产物形式，不在本轮提前实现。
- 本轮仅更新开发记录与组件说明，未修改实现代码，未提交或推送Git。
