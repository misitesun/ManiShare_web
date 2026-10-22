# 单词、句子、音频游戏联合检查（2026-10-22）

后续更新：用户确认的A至D四类问题已经修复，完整测试和正式构建通过，生产包与回归结果见[构建修复与生产回归](2026-10-22-practice-build-repair.md)。下方保留首轮修复前的检查结论与证据；完整生产冒烟脚本的旧音源断言等剩余项以新记录为准。

## 首轮结论（修复前）

**当前版本不能打包交付。** 标准构建、类型诊断和完整单测存在阻塞；本轮只检查和列项，没有修复产品源码、提交或推送Git。已有`dist/production`为10月20日的旧产物，不能当成本次代码的构建结果。

当前开发代码的20个模式已在真实Chrome完成8组CSS视口、共160个模式／尺寸组合检查：页面横向溢出0项、未加载题图0项，已显示封面比例均在16∶9检查容差内。另执行了桌面Electron开发态交互、Chrome手机尺寸状态流程和macOS Safari关键路径抽查。这些结果不替代生产静态包、安装包或iOS／Android真机验收。

本次用户明确要求统一测试，覆盖此前“暂不测试”的开发阶段约定。原来的3000开发服务已按原配置恢复；临时视口已还原，Safari／Chrome临时测试标签已关闭。原有未提交功能改动保留。

## 待确认处理项

### A．P1：源码契约阻断正式构建，7处

`pnpm run desktop:build`在Web构建的`lint:source-contracts`阶段失败，尚未进入正式Next静态导出。以下`className`表达式不符合当前完整字面量分支契约，涉及`undefined`分支或组合表达式：

- [AnnotatedText.tsx:344](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/AnnotatedText.tsx:344)
- [PracticeAnswerPanel.tsx:65](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/PracticeAnswerPanel.tsx:65)
- [SentenceBlocksExercise.tsx:78](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/SentenceBlocksExercise.tsx:78)
- [SentenceListeningControls.tsx:146](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/SentenceListeningControls.tsx:146)
- [WordCardHeading.tsx:63](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/WordCardHeading.tsx:63)
- [WordPronunciationAnalysis.tsx:23](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/WordPronunciationAnalysis.tsx:23)
- [WordPronunciationCard.tsx:207](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/WordPronunciationCard.tsx:207)

建议：保持现有界面和状态语义，将表达式改为校验器支持的完整字面量写法，不修改或放宽校验器。

### B．P1：独立类型诊断失败，4个文件、6条错误

标准构建停止后，通过原环境runner执行独立构建诊断。路由类型生成通过，随后TypeScript失败，Next导出未执行：

- [PracticeSettingsPanels.tsx:53](/Users/sly/react_work/漫奇说web/src/fsd/features/learning-settings/ui/PracticeSettingsPanels.tsx:53)：给`TldButton`传入公共Props未开放的`className`，1条错误。此文件不在本轮练习功能未提交diff中，属于当前仓库既有阻塞，仍须解决后才能构建。
- [practice-demo.ts:574](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/model/practice-demo.ts:574)：action联合类型没有充分收窄为`move`，读取`total`／`delta`产生2条错误。建议拆分联合判别或显式处理移动分支，保持现有业务行为。
- [SentenceReadingExercise.tsx:129](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/SentenceReadingExercise.tsx:129)：闭包中的`viewport`仍为可空类型，赋值及传参产生2条错误。
- [useWordSpellingQuestionMotion.ts:47](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/useWordSpellingQuestionMotion.ts:47)：闭包中的`root`仍可能为null，1条错误。此文件不在当前未提交diff中。

建议：修正真实类型和生命周期边界，不使用非空断言或忽略类型检查。

### C．P1：完整单测未通过，10项首个失败点需要同步

`pnpm run test`的TS／TSX／Electron测试阶段：868项，858通过、10失败；因此命令链未执行后半段脚本测试。补充单独运行脚本测试后，24项全部通过。合计执行892项，882通过、10失败；不能据此标记完整测试通过。

这10项当前首个失败点均与已确认实现变化或脆弱的HTML匹配有关，应先维护测试预期，再完整重跑，不能直接忽略：

1. [practice-footer.test.ts:144](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/model/practice-footer.test.ts:144)：中译英跳格预期未包含新确认的`Space`提示。
2. [reference-layout.test.ts:88](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/model/reference-layout.test.ts:88)：仍要求一个input保存`Keep my draft`整句，而当前按词段保存，原生input只承接活动段。应检查完整分段状态和保留的文本。
3. [reference-layout.test.ts:118](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/model/reference-layout.test.ts:118)：按钮文本仍预期“显示答案”，当前为“空格显示答案”。
4. [sentence-typing.test.ts:10](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/model/sentence-typing.test.ts:10)：仍预期音频题库等于旧题库对象，未反映音频来源隔离ID及已接入音源。
5. [word-spelling.test.ts:15](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/model/word-spelling.test.ts:15)：旧题库对象全等断言未反映新增`readingSource`。
6. [PracticeContent.test.ts:370](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/PracticeContent.test.ts:370)：要求中译英正确态与沉浸听力的整个HTML完全相等，未区分当前听力白色英文与答后状态的展示差异。
7. [PracticeContent.test.ts:401](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/PracticeContent.test.ts:401)：自查结果与听力的整份HTML全等断言存在同类问题，应验证实际复用结构和各状态的展示要求。
8. [WordAnswerCard.test.ts:80](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/WordAnswerCard.test.ts:80)：用全文不得存在`href`验证外链禁用，误命中React图片预加载`link href`；应只检查交互链接。
9. [WordPronunciationAnalysis.test.ts:27](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/WordPronunciationAnalysis.test.ts:27)：按`data-word-analysis-example=""`计数，当前布尔data属性为`"true"`。
10. [WordTypingExercise.test.ts:77](/Users/sly/react_work/漫奇说web/src/fsd/pages/practice/ui/WordTypingExercise.test.ts:77)：正则强制`value`在`disabled`之前，当前渲染顺序相反，两个属性实际均存在。

建议：围绕可观察行为更新断言，保留输入、题态、题库隔离及禁止操作的原验证目标。首个断言修正后，仍需重新确认这些用例的后续断言及完整测试结果。

### D．P2：模块文档校验失败，3个README缺9项描述

- [oral-assessment/README.md](/Users/sly/react_work/漫奇说web/src/fsd/features/oral-assessment/README.md)：缺校验要求的“职责”“约束”描述。
- [popover-trigger/README.md](/Users/sly/react_work/漫奇说web/src/fsd/shared/lib/popover-trigger/README.md)：缺“职责”“约束”“扩展”“验证”描述。
- [sound-player/README.md](/Users/sly/react_work/漫奇说web/src/fsd/shared/lib/sound-player/README.md)：缺“约束”“扩展”“验证”描述。

现有正文已包含一部分相关信息，需要整理成符合模块文档契约的明确结构。修复A后该门禁仍会阻断标准构建。

### 建议确认范围

- [ ] A：保持效果不变，修复7处源码契约问题。
- [ ] B：修复4个文件中的6条类型错误，包含当前仓库既有阻塞。
- [ ] C：同步10项失败测试，保留真实验证目标后重跑完整测试。
- [ ] D：补齐3份模块README的9项描述。
- [ ] A至D处理后，再执行正式构建、生产Web／Electron协议和安装包验收；本次开发态通过项不能直接替代。

## 本轮已验证的范围

### 环境与源码快照

- 当前工作区`main`，HEAD `a0b098606550d261b72091ea7d4f81e22d996188`，包含原有未提交及未跟踪的功能代码。
- 1498个源码／资源／配置文件摘要：`a7e199ff25072a90d33413f44d5f1dfc874a4ccceed9c73d9ee3256e6377402e`；快照检查未发现这些文件在本轮检查期间被修改。
- macOS 26.0／arm64；Chrome 155.0.8059.85；Safari 26.0；Electron 43.4.1。
- [快照详情](../../dist/practice-validation-20261022/snapshot.json)。本报告写入不改变被测运行代码。

### 静态检查和构建

- Prettier完整检查通过，`git diff --check`通过。
- `lint:ai-skills`通过。
- `desktop:build:main`单独编译通过，仅证明桌面主进程与preload编译，不代表renderer或安装包通过。
- 标准`desktop:build`、独立renderer类型／导出诊断、完整`test`、`lint:module-docs`失败，原因见A至D。
- Oxlint有19条非阻断警告，涉及Hook依赖、测试children传法和正则等；未将警告直接认定为已复现产品缺陷，原始记录保留。

### Chrome响应式矩阵

20种模式全部覆盖：单词6种（拼读、拼写、默写、句中练义、指法、口语），句子7种与音频7种（沉浸听力、阅读全览、中译英、理解自查、拼块、指法、口语）。

每种模式检查以下8个真实Chrome CSS视口：1920×1080、1440×900、1280×720、1024×768、768×1024、390×844、360×640、844×390。总计160项，未发现页面横向溢出、未加载题图或封面比例不符。单词48项、句子56项、音频56项。该矩阵为默认题态；后续列出的状态流程另行抽查。

平板／H5均为桌面浏览器模拟尺寸，没有将其记为移动系统或真机通过。截图与几何可以帮助复核，但不能证明系统软键盘、触摸、iOS Safari音频策略或安全区真机行为。

### 交互与状态抽查

- 两类游戏的阅读、自查、指法、口语共8个组合：↓不展开答案；手动打开后↑不收起；顶部答案点击与Esc保持可用。
- 自查空格揭晓、再空格下一题；Chrome手机尺寸下的句子／音频揭晓均实际出现`lottie-0`特效。
- 句中练义填空正确提交，以及句中辩义空格前无翻译、空格后显示翻译。
- 单词拼写／默写／填空／指法正确提交，句子／音频中译英分段输入与拼块词序判题。
- `woman → woean → 空格 → 连续Backspace五次 → 输入w`后光标为1，继续补`om`后判对；Chrome手机尺寸与Safari均复核，没有跳过已删的o。
- 三类口语均经过准备、录音、评分、结果；Chrome手机尺寸的评分卡未横向溢出，长内容可滚动；Safari完成示例朗读回放，按钮及标签页音频状态实际进入播放。
- 三类小屏设置修改切读后，浮层保持展开，原输入恢复焦点；测试改动的开关已恢复。
- 844×390下三类指法内容均实际滚动到底：内容区高215、内容高935、scrollTop为719.5，统计区底边274，固定底栏从290开始，统计区未被遮挡。
- 实际Chrome验证空输入的Shift＋右键切题，切题动画结束后输入框恢复焦点。最初桌面脚本中两项切题失败没有作为产品缺陷计入，脚本发送方式与实际浏览器结果区分记录。

### 音频与媒体

- 37份MP3／WAV提示音文件存在，字节摘要与manifest一致，系统`afinfo`元数据解析均成功。
- 已运行的桌面／Chrome／Safari路径覆盖题目朗读、判题、自查及模拟口语相关入口；Safari示例回放有实际播放状态证据。
- 未逐一在不同真实设备听辨37种音色，元数据检查不等于浏览器解码或扬声器听感验收。
- 首次无手势进入Chrome时观察到“点击朗读重试”的浏览器拒播回退；这属于需用户交互恢复的自动播放策略，不作为已复现功能缺陷。

## 未完成与不能推导的结论

- **生产Web静态包、严格生产CSP／RSC、Electron `englishlearning`协议与安装包未通过本次验收。** 它们被A、B等构建问题挡住，不能使用旧生产目录补充“通过”。
- Electron开发态完成过40个桌面模式／视口检查及多条交互检查；额外自动化窗口／媒体探测阶段出现宿主SIGSEGV和后续启动等待。没有足够证据将其归因于产品页面，不能把该脚本记为完整通过。完整尺寸矩阵最终改由已授权的真实Chrome接口完成，生产桌面包仍须后续复验。
- 未完成可信的125%／150%／200%真实浏览器缩放验证；发送放大快捷键后读取的尺寸未改变，因此没有把该尝试算作缩放通过。
- 未完成浅色主题完整矩阵、PC真实hover完整交互验收、reduced-motion完整运行矩阵、Windows安装包、Android／iOS／平板真机、系统软键盘／原生IME候选窗／真实麦克风采集与评分接口验收。
- 口语录音、评分目前仍为已确认的模拟流程；播放示例朗读不是播放用户亲录音频。真实录音／回放／评分接口是已有待对接范围，本轮没有擅自接入或虚构音频产物。
- Chrome日志末次采集的200条警告均来自已安装浏览器扩展，不计为本项目缺陷；有采集数量上限，不能据此宣称全程零控制台错误。早期Electron观察范围内没有业务请求或资源失败，但该运行未完整结束，不能替代生产网络验收。

本轮读取了Next静态运行时、文本输入、主题切换契约；未改变其CSP／协议、原生输入与IME、焦点、减少动态效果或清理规则。剩余兼容性按上述边界保留待验收。

## 证据

- [标准构建日志](../../dist/practice-validation-20261022/build.log)
- [独立类型／导出诊断](../../dist/practice-validation-20261022/export-diagnostic.log)
- [完整TS／TSX／Electron测试日志](../../dist/practice-validation-20261022/unit.log)
- [脚本测试日志](../../dist/practice-validation-20261022/script-tests.log)
- [模块文档校验](../../dist/practice-validation-20261022/module-docs.log)
- [Electron主进程编译](../../dist/practice-validation-20261022/electron-main.log)
- [Chrome160项响应式数据](../../dist/practice-validation-20261022/chrome-matrix.json)
- [Chrome状态／设置／短屏滚动检查](../../dist/practice-validation-20261022/chrome-interactions.json)
- [Chrome答案快捷键检查](../../dist/practice-validation-20261022/chrome-answer-keys.json)
- [37份音效素材校验](../../dist/practice-validation-20261022/audio-assets.json)
- [H5口语结果截图](../../dist/practice-validation-20261022/screens/Chrome-h5-oral-result-audio.png)
- [短横屏实际滚动截图](../../dist/practice-validation-20261022/screens/Chrome-short-scroll-sentence.png)
- [Safari单词纠错截图](../../dist/practice-validation-20261022/screens/safari-word-correction.png)
- [Safari句子正确态截图](../../dist/practice-validation-20261022/screens/safari-sentence-correct.png)
- [Safari口语回放截图](../../dist/practice-validation-20261022/screens/safari-oral-result.png)

`dist/practice-validation-20261022/`为本轮验收证据目录，不是应用发布包；同目录的早期脚本失败／中断记录保留用于排查，不覆盖最终Chrome矩阵和本报告的结论。当前共保留86张截图，其中含调试阶段截图，不把截图总数当作通过用例数。
