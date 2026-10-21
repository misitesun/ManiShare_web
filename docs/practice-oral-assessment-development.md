# 口语评测源码审阅与模拟 UI

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
