# 练习反馈素材与音效映射

- 单词拼写新四态模拟评测通过公共控制器回调沿用本页事件入口：开始发出 `recordStart`，模拟结果按实际样例等级发出 `evaluationComplete:KEEP TRYING`，不再固定播 EXCELLENT；遵守已有设置和播放器清理。播放录音按钮只演示回放状态，既不生成也不播放录音文件，未新增音效资源。

更新于2026-10-20。用户确认完整迁入新版哇学社练习交互声音，并先接单词拼读／拼写及设置试听；另明确删除“章节完成音效1”，以“落幕（默认）”作为课程完成默认音色。下列音效是已建立本地映射、尚待用户试听的实现记录，不代表真实设备解码验收通过。2026-10-19的声音空映射与9项完成音色说明由本记录覆盖。

## 理解自查答案出现提示音（2026-10-22）

句子与音频游戏的理解自查共用`PracticePage.primary`揭晓入口。首次通过空格／Enter或显示答案操作揭晓时发出`answerReveal`，声音与单词默写答对完全同源：由`correctTone`选择清音／清悦，遵守`correctSound`及`correctVolume`；不使用切题音效或切题开关。事件沿原`PracticeFeedbackSoundController`播放和去重，不新增资源、请求、设置或播放器。

按用户追加要求，揭晓同时复用单词答对特效：`getPracticeFeedbackAnimation`将`answerReveal`与`correct`映射到同一`correctEffect`开关及`correctEffectType`样式，沿现有`PracticeFeedback`的事件ID去重、单次播放、减少动态效果及后台／卸载清理，不新增动画资源。音效和特效开关保持独立。

揭晓仍为`revealed`，不计为答对；再次操作按原流程下一题，不重复发出揭晓事件。已有暂停、后台、阻断层与卸载清理保持。已补音色／开关／音量、动画映射／门控、事件去重及两来源主流程回归，但按用户要求未运行测试、构建、试听或视觉验收，只做定向格式化和静态差异核对；PC、平板／H5及Electron实际效果待用户验收，未提交／推送Git。

## 1. 当前归属与来源

- 真实资源归`features/learning-settings/assets/sounds`，共37份、1348980字节。音源注册表为[feedback-sounds.ts](../src/fsd/features/learning-settings/model/feedback-sounds.ts)，经feature根入口供设置与练习共用；每个音色映射到独立的原文件。
- 来源为用户指定的`/Users/sly/Downloads/新哇学社/waxueshe-client-web-main/src/assets/sound/`，本轮用户确认迁入；参考项目只读。原文件逐字节复制，完整SHA-256、字节大小及afinfo读取的元数据时长见[manifest.json](../src/fsd/features/learning-settings/assets/sounds/manifest.json)。元数据时长不替代设备实播，第三方原始许可未另行核实。
- 播放技术能力为`shared/lib/sound-player`。业务开关、音量、事件优先级和去重仍由练习／设置拥有，不把课程TTS、单词和例句音源与短提示音混用。没有新增远端音源、业务请求、依赖或麦克风权限。

## 2. 原版动画资源与声纹（2026-10-19确认覆盖旧粒子方案）

用户确认完整迁入哇学社当前源码的7份答对Lottie及1份章节完成烟花。原文件跟随features/learning-settings进入assets/feedback，保留字节及来源摘要；累计444738字节，自包含矢量，无外部图片/字体/表达式。此前五种emoji粒子属于旧方案，本次替换后不再作为当前选项，历史v1值兼容回退首份lottie-0，不冒充一一对应。

| 当前ID | 中文选择 | 原文件 | 原版速度 |
| --- | --- | --- | --- |
| lottie-0 | 礼花绽放（默认） | lottie/success/0.json | 1 |
| lottie-1 | 缤纷彩纸 | lottie/success/1.json | 1 |
| lottie-2 | 闪耀烟花 | lottie/success/2.json | 1.5 |
| lottie-4 | 鼓掌喝彩 | lottie/success/4.json | 1.5 |
| lottie-5 | 欢庆光芒 | lottie/success/5.json | 1.5 |
| lottie-6 | 点赞鼓励 | lottie/success/6.json | 1.5 |
| lottie-7 | 粒子绽放 | lottie/success/7.json | 1 |
| chapter-complete | 章节完成烟花（仅开关） | soloPractice/finish/practice-finish-fireworks.json | 1，4秒循环 |

设置卡片循环预览；练习答对按事件ID单次播放，章节烟花随完成浮层开闭。停止、后台、离页和reduced-motion立即清理；减少动态效果下的设置卡片只显示静帧。依赖通过shared/lib/animation封装原版版本lottie-web@5.13.0及siriwave@2.4.0，不复制Vue/Pinia逻辑，不放宽CSP。源码迁入与专项实际运行结果分开，最终证据见练习开发文档“原版声纹与Lottie动画接入”。

五种声纹无位图素材；由LearningAudioWave统一绘制。设置的录音/朗读两项分别预览；录音使用现有明确标记的演示状态，朗读跟随真实媒体playing/waiting/pause/ended/error，不新增麦克风采集、评分或业务音效。声音资源当前状态见下方迁入记录。

## 3. 当前声音资源

- 打字13种：`type/0..12.mp3`，对接`typingTone/typingSound/typingVolume`。原键为0；跳音为12；轻键为1，其余按源码逐项对应，不能按下拉位置推断编号。
- 答对2种：清音对应`success/0.mp3`，清悦对应`success/1.wav`；使用`correctSound/correctTone/correctVolume`。
- 答错6种：`error/0..5.mp3`，轻警／低鸣／短促／顿响／警示／闷扣逐项对应；使用`errorSound/errorTone/errorVolume`。
- 课程完成8种：`finish/0..7.mp3`，落幕／终章／礼赞／星河／收束／凯旋／花火／余韵。默认落幕对应0，旧“章节完成音效1”已从选项及资源映射删除，v1旧缓存仅该字段迁移到落幕并回写一次，保留合法音量和其他设置。使用`completionSound/completionTone/completionVolume`。
- 卡牌操作3种：切题`game/next.wav`、再来`game/dim.mp3`、记住`game/remember.mp3`。共用切题开关，基准音量0.4，不借用打字音量。
- 录音开始1种：`record/1.mp3`，当前仅显式录音演示开始／重录时播放，基准0.4；不请求麦克风，不声称生成录音。
- 评价4种：`oral/keep_trying.mp3`、`good.mp3`、`excellent.mp3`、`perfect.mp3`，对应显式评价标签；使用`evaluationSound`、基准1。没有评价标签时以GOOD作通用结束提示，不推算真实分档。设置试听为GOOD；本轮拼写口语的固定“表现优秀”演示使用EXCELLENT，不新增评分阈值或正式评分。

四类可选音色合计29种，均使用各自现有1–100音量字段。源码没有单独的提交音源，完整校验后按正确／错误结果提示；未填满、导航或空提交不伪造错误声音。37份中未触达的口语标签已登记供共用入口选择，不以无来源的评分去触发。

## 4. 已接入事件与设置

- `PracticePage`有效输入的`onInput`、`submitWordSpelling`、实际切题、课程完成、接受的再来／记住动作发出同一递增ID事件；按键、点击及拖拽复用实际业务入口。只读旧卡不接收输入，Cursor移动、预渲染及设置恢复不发打字声。揭晓、掌握占位和未接入的不熟保存不冒充答对事件。
- `PracticeFeedback`沿设置根入口读取同一注册表，用户动作中同步请求play，React消费同ID不重响。公共切题／完成可供所有模式共用，本轮具体输入、判题和卡牌操作接线覆盖单词拼读／拼写；其他模式不新增判题或输入规则。
- 独立设置页与练习设置弹窗的`EffectsSettings`提供六类试听／停止试听入口，保留原布局和主题。关闭对应开关禁用试听并停止当前声音；选音色、恢复或打开设置不自动播放，音量修改影响当前试听及后续练习事件。

## 5. 播放与清理

- 打字独立通道，50ms内同音色请求合并；只复用当前一份媒体元素，结束可保留解码资源，换源／停止／卸载释放。结果通道不会被后续打字截断；正在播放正确或卡牌操作时，跟随的切题声不叠响。
- 每次播放有代次与事件身份，迟到play结果不能改写新状态。停止／换源／后台／失焦／打开阻断层／重置／离页清理监听与音源，返回前台不补播。音效与动画开关独立，reduced-motion只控制动画，普通音效仍按音效设置。
- 浏览器拒播、加载失败和缺项反馈真实；正常加载／播放／结束不再覆盖作答文案，不持续显示底部技术状态。失败不回滚输入、正确数、黄晶或完成状态。
- MP3经静态resolver以`audio/mpeg`返回，WAV仍为`audio/wav`；Web静态预览与Electron共用MP3单区间GET／HEAD规则。不放宽路径校验、CSP、导航限制或IPC。

## 6. 本轮验证边界

已补映射完整性、跳音编号、旧完成音色迁移、播放器复用／拒播／过期结果、事件去重／优先级、设置SSR入口和MP3响应类型／Range断言。按用户要求仅做资源元数据整理、源码格式化和差异核对，未运行测试、lint、类型检查、构建、浏览器或Electron试听。PC、平板／H5触摸／软键盘及真机声音、音量、连续打字延迟与自动播放策略均待用户验收。
