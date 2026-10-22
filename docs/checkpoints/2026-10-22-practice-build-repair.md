# 练习模式构建修复与生产回归（2026-10-22）

## 结果

用户确认的A至D四类问题已修复：7处源码契约、4个文件的6条类型错误、10项失败测试及3份模块README。完整测试892项通过，正式Web与Electron主进程构建通过，275个HTML及配套RSC／资源重新导出。Web归档和Mac arm64／x64安装包已生成，未提交或推送Git。

本轮没有改动输入、判题、快捷键、音频或口语阶段机，也没有调整页面布局参数。Chrome生产页面的25条关键交互、Safari原生输入纠错及Electron生产协议20模式定向检查完成，未发现本轮修复引入的交互或布局回归。完整生产冒烟命令仍被旧朗读断言阻断，不能标记整套冒烟通过，见下方待确认项。

## 实际修改与影响控制

- **源码契约**：6处可选`className`的空分支改成完整空字面量；拼块按钮改用完整字面量与data状态选择器，保留现有尺寸、间距、颜色、禁用和选中语义。没有修改源码契约检查器或主题token。
- **拼块尺寸保护**：原来`together`同时存在的设计字号类实际计算为38px／53px。本轮以修复前的真实计算值为准，没有将其改成34px／48px。1920×1080下，初始、已选择、全部错序三态的17个词块，其位置、宽高、字号、行高、文字／背景／边框颜色、内边距及阴影逐项一致；生产包错序态再次比对一致。
- **按钮类型**：移除设置试听按钮传给`TldButton`的非公开`className`。该参数原先已被组件内部`className`覆盖，因此保留的仍是原来实际生效的compact／secondary外观；公共按钮API及试听行为未变。
- **类型收窄**：拆开`submit-spelling`和`submit-answer`的联合判别声明，运行时reducer分支不变；两个受非空守卫保护的内部回调改为守卫后声明的箭头函数，保留原调用位置、GSAP完成处理、监听与清理。
- **测试维护**：同步空格跳格、按词段保留草稿、独立音频题目ID及新增音源预期；结果复用测试继续检查完整结构，仅明确区分听力白色英文与答后颜色；外链、布尔data属性和原生input断言不再误依赖预加载链接或属性顺序。保留原验证目标，未跳过失败用例。
- **模块文档**：补齐口语评测、浮层触发、短音效的职责／入口／约束／扩展／验证描述，保留真实录音与示例回放的既定边界。

修复范围为11个实现文件、8个测试文件和3份模块README；另新增本记录并在首轮检查记录中链接后续结果。原有未提交功能代码保留。文件列表见[本轮文件清单](../../dist/practice-repair-20261022/modified-files.json)。

## 已执行验证

### 测试与正式构建

- `pnpm run test`通过：TS／TSX／Electron测试868项，脚本测试24项，失败0项。
- `pnpm run desktop:build`通过，包含完整格式、Oxlint、源码契约、AI技能、模块文档、类型、Next静态导出及Electron主进程编译。275个业务HTML与完整RSC／资源校验通过。
- `git diff --check`通过。Oxlint仍有19条非阻断警告，属于首轮已记录的Hook依赖、测试属性和正则等范围；本轮没有把它们直接认定为已复现产品缺陷。
- `pnpm exec electron-builder --mac --publish never`完成。两份DMG的`hdiutil verify`通过，两份app的`codesign --verify --deep --strict`通过。

### Chrome生产静态包

使用本次`dist/production`及仓库原有严格CSP静态预览，覆盖单词6模式、句子7模式和音频7模式。

8个实际CSS视口分别为1920×1080、1440×900、1280×720、1024×768、768×1024、390×844、360×640、844×390。最终每个视口均有20模式，160个唯一组合；页面横向溢出、封面未加载、封面比例超出16∶9容差均为0项。较窄尺寸是桌面浏览器几何模拟，平板／H5视觉与真机兼容仍待用户验收。

中间尝试多标签并行时，视口只对当前标签生效，部分记录存在尺寸重复；已按页面实测值排除并补测。最终统计只使用[production-matrix.json](../../dist/practice-repair-20261022/production-matrix.json)，没有把中间记录计入160项。

25条关键交互检查包括：

- `woean → 空格 → Backspace五次 → w`后光标位于1，继续补`om`后判对；空输入左右键、部分输入左右键不改逻辑位置，部分输入空格在已填位置与下一空位间循环。
- 单词拼写空输入按Shift＋右键切题，动画结束后新输入框自动聚焦。
- 三类局部设置切换“切读”后，浮层保持展开且输入恢复焦点；测试更改的开关已还原。
- 句子与音频中译英按词段输入、空格跳格和Enter判题正确。
- 两类游戏的阅读、自查、指法和口语8组合：↓不展开答案，手动顶部入口可打开，↑不收起，Esc可关闭。
- 两类自查空格揭晓均有`lottie-0`特效，再空格进入下一题。
- 三类口语完成准备、录音、评分与结果，点击示例回放实际进入播放状态并显示活动声纹；没有把它标为真实麦克风录音。
- 844×390下三类指法均能整体滚动到底：main高度215、内容高929、scrollTop为714；统计区底边约273.93，底栏从290开始，没有遮挡统计区。
- 单词拼读Shift＋L后实际出现`playing`朗读状态。

PC视觉查看采用1920×1080和1440×900。拼块三态及生产错误态的计算样式／几何比对见[开发态前后对比](../../dist/practice-repair-20261022/blocks-after.json)与[生产态对比](../../dist/practice-repair-20261022/blocks-production.json)。

### Electron与Safari

- Electron 43.4.1直接装载本次主进程、preload、生产文件及`englishlearning://app`协议，1440×900下20模式全部水合，封面加载／比例及横向溢出检查通过；定向运行观察范围内资源失败、业务请求、控制台警告／错误均为0。sandbox与contextIsolation为true，nodeIntegration为false，预加载版本接口正常。该定向检查不替代下方未完成的完整冒烟。
- macOS Safari在本次生产静态预览中，实际键盘复现`woean`错误提交、连续删除与补`wom`，最终展示woman正确结果、朗读和口语入口。仅为桌面Safari原生输入回归，不推导iOS Safari结论。
- 阅读了Next静态运行时、文本输入及主题兼容性契约。本轮保留原生输入／IME、焦点、CSP／协议、reduced-motion和取消清理边界，没有新增接口、依赖或Electron桥。

## 产物

- [Web生产静态归档](../../release/english-learning-web-production-20261022.tar.gz)，约131.17MiB。
- [Mac Apple芯片安装包](../../release/English%20Learning-0.0.0-arm64.dmg)，约328.43MiB。
- [Mac Intel芯片安装包](../../release/English%20Learning-0.0.0.dmg)，约333.12MiB。

文件字节数、SHA256和结果摘要见[result.json](../../dist/practice-repair-20261022/result.json)。Mac包生成及签名／完整性校验通过；未执行系统安装、Intel设备运行或macOS发布公证。没有生成Windows安装包。

## 待用户确认的后续项

1. **生产完整冒烟脚本需要同步。** `pnpm run runtime:smoke`在`scripts/practice-shortcuts-runtime-smoke.cjs:1100`后的迁移快捷键检查失败：脚本等待“发音素材未接入”提示，而当前单词拼读已经绑定音源。Chrome生产页Shift＋L实际进入playing；完整旧绑定迁移及脚本后续流程仍需同步断言后重跑。本轮没有修改该脚本或快捷键业务，不能将完整命令写成通过。
2. **设备与系统验收。** 平板／H5视觉、iOS／Android软键盘与原生IME、触摸、Windows／Intel设备运行，以及安装／发布公证待对应环境验收。真实浏览器125%／150%／200%缩放、PC悬停完整矩阵和浅色主题完整矩阵本轮未重新执行。
3. **已有接口边界。** 录音和评分继续使用已确认的模拟控制器；“播放录音”最终接用户本次录音，仍待后续接口契约确认。当前示例WAV回放与声纹正常，不代表真实采集／评分接口完成。

3000端口开发服务已按原配置恢复。临时浏览器标签及视口在检查结束后清理，未进行远端Git操作。

## 证据索引

- [完整测试日志](../../dist/practice-repair-20261022/test-final.log)
- [正式构建日志](../../dist/practice-repair-20261022/build.log)
- [Mac打包日志](../../dist/practice-repair-20261022/package-mac.log)
- [Chrome25条交互：17条流程](../../dist/practice-repair-20261022/production-interactions.json)与[8条答案快捷键](../../dist/practice-repair-20261022/production-answer-keys.json)
- [Electron20模式结果](../../dist/practice-repair-20261022/electron-production.json)与[定向检查脚本](../../dist/practice-repair-20261022/electron-production-smoke.cjs)
- [完整冒烟未通过日志](../../dist/practice-repair-20261022/runtime-smoke.log)
- [Safari生产纠错截图](../../dist/practice-repair-20261022/screens/safari-production-correction.png)
- [生产拼块错误态截图](../../dist/practice-repair-20261022/screens/production-blocks-final.png)
- [短屏滚动截图](../../dist/practice-repair-20261022/screens/production-short-scroll.png)
