# 练习文本输入与原生编辑历史

- **2026-10-20当前例外：单词拼写。** 用户确认按新版哇学社的固定字母位与纠错流程重做`word:spell`，其入口现为`WordSpellingInput`／`word-spelling-input`。以下整词编辑和原生Undo契约继续约束`PracticeWordSlotsInput`及其他消费者；历史拼写的末词提交／公共feedback透传记录不再代表当前拼写输入。新输入仍用真实input接收原生键盘、剪贴板和组合缓冲，组合期间不判题或移动选区，结束后只接收ASCII字母；不使用全局字符兜底、execCommand或合成输入事件。字母位与逻辑光标由模式模型拥有，真实缓冲只含已填字母，字母更新后会在非组合期把原生光标移到缓冲末尾；此行为有意区别于下方整词原生编辑路径。Ctrl／Command+Z、Y／Shift+Z使用最多100次模式内历史恢复字母／错位／逻辑光标，不回滚会话已计提交，不冒称与OS原生Undo等价。切换提示／音标及翻面保留字母，切题／重练释放模型；其他模式不引入此例外。仅补模型和SSR用例、定向格式化／差异核对，未运行测试、构建或浏览器操作；真实IME、软键盘、剪贴板、Web／Electron及PC／平板／H5仍待用户验收。详见[单词实施记录](../practice-word-games-development.md#2026-10-20-拼写逐字输入与音标联动)。

- 适用范围：`pages/practice` 的整词可视槽、真实答案 input、词槽点击和原生撤销/输入法；不是通用富文本编辑器或判题策略。
- 已确认现象：2026-10-19 Electron 43 的隔离原生输入探针中，先原生录入 `brush` 再通过 `input.value='brush '` 补定位空格，Undo 无法撤回原有录入。原生录入路径能够正常撤回。因此“完整值未丢失”不能替代编辑历史验收；React 受控值在原生事件之外被程序改写也须避免。
- 唯一入口：`src/fsd/pages/practice/ui/PracticeWordSlotsInput.tsx` 接收完整原生字符串；`model/word-slot-input.ts` 只派生词槽、测宽占位和 UTF-16 选区。`TypingKeyboard`只读原生输入与物理按键，不生成文字。
- 必须保留：普通输入、空格、删除、选区替换、粘贴、撤销、重做及组合输入使用真实 input；不在 Effect 中反复写 value 或把光标拉到末尾。Enter 使用既有统一提交，Tab/Shift+Tab 使用原生焦点。已存在词的点击只改变选区；组合期间不做程序选区或补字。
- 2026-10-19单词拼写特例：仅该模式在最后词槽已填、全文末尾无选区时把普通空格解释为提交；keydown消费后不再插入。没有keydown时只识别原生input追加的单个insertText空格，以事件内最新原值提交，不先程序trim回写。组合期间、229、粘贴和修改键保持原生语义。可视词槽按目标词数固定，超额文本在末槽完整可编辑，尾空格不扩张数量；此规则不把其他模式的空格改成全局提交。
- 尚未存在词的点击：在用户点击处理器中把选区移至原文末尾，尝试 `execCommand('insertText')` 补最少定位空格，由原生 input 事件一次更新状态。该编辑命令已弃用，但直接赋值无法保留 Undo，目前此窄场景缺少等价标准替代，依据 [MDN execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)。普通键盘/软键盘录入不依赖它，不在 input/beforeinput 回调中重入命令，不注册全局兜底字符监听。
- 失败语义：编辑命令不支持、拒绝或抛错时不改写原值，不合成字符事件；保留原文末尾焦点，用户仍可用原生空格继续到后词。不得以 value/setRangeText 程序补写兜底而悄悄清空原生编辑历史。
- 自动验证：同目录模型与组件测试；`scripts/practice-word-input-runtime-smoke.cjs` 在生产 Web/Electron 中检查打字→点击后词→撤销/重做，以及编辑命令故障注入。故障注入与真实键盘操作分开记录；实际执行结果见[练习开发文档](../practice-page-development.md#整词输入显示与原生编辑2026-10-19)。
- 人工验收：PC检查词槽宽度、活动线、点击定位、原生编辑、实际缩放及焦点；平板/H5 的系统软键盘、输入法、触摸/横向滚动、页面放大和外接键盘仍待用户真机验收，不据 Chromium 单宿主推断全部浏览器兼容。
- 替换条件：如改用新的标准原生编辑路径，必须在目标浏览器/Electron中同时证明原文、选区、IME及跨词点击的Undo/Redo保持，再删除窄命令与对应失败回退；不得仅因API弃用而改回直接value赋值。

- 2026-10-20公共反馈：可选feedback由调用方提供，公共输入不判题。按Unicode码点提供可见槽状态，原生selection仍为UTF-16；DOM Range跨分段文本累计且排除缺字占位。缺字不补到input，多字不截断，过期反馈不套新值；仅反馈更新不改变选区和手动滚动。仅word:spell显式启用作答聚焦命令（↑↓、Shift+L/J/K及合法绑定），命中后阻止原生输入，长按不重复动作；普通编辑器不透传，IME／229及原生编辑组合继续保留。新生产专项practice-word-spell-public-runtime-smoke.cjs用隔离fixture挂载实际组件，须与真实卡面判题、OS输入法和剪贴板证据分开记录。
