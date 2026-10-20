# CardSwap组件直接接入

## 当前四层展示适配（2026-10-19）

用户后续确认恢复原组件四张展示、3D透视与hover。当前参数统一为visible=4、cardDistance=32、verticalDistance=2、depth=80、perspective=900、parallax=0.5和hoverSpread=0.12，沿原`q*dx*spread / -q*dy*spread / -q*dz`位姿及原弹簧运行。主卡尺寸与内容保持，后卡不再使用Figma二维非等比缩放，旧的关闭hover说明仅代表前轮状态。

业务数组与展示槽分开：普通导航仍按业务有限顺序；再来将真正后续题目与当前卡组合为至多四张展示牌，旧卡DOWN清出→降层→回插到可见末槽，且不提前补第五张；宿主完成后再把ID写入业务队尾。物理节点绑定稳定key，以成员集合身份而非业务顺序重建，业务重排不销毁回插节点。后续动作重新按真实业务顺序补位，上一题/记住不混入视觉轮转。与原四项循环示例的差异仅为本产品的有限题序/完整队列契约，不声称原组件自身提供这些业务规则。

隐藏节点的transform归零，拼读会话整页边界裁切动画溢出，卡堆局部不裁切，防止不可见退场卡扩大页面高度并保留页面内全方向拖动。PC主卡500px、rAF积分/阻尼、二维速度阈值与全角度跟手保留；hover仅用于非触屏且无reduced-motion。阶段、清理、兼容与真实DOM验证见开发文档“四张展示”节；2026-10-20的后续修复仅完成实现和静态核对，不能沿用历史运行时结果充当本轮通过。

## 2026-10-20 松手退场与快速手势修复

- 普通next／手势的退场距离从卡片自身clearance改为`card-swap-throw`计算的可见视口边缘：从释放时的真实位姿继续沿释放方向运动，计入旋转外框及64px光晕余量，完全离屏后才进入gone。上一题按当前视口从对应方向恢复；原rAF积分、弹簧频率／阻尼、释放速度和0.12秒方向投射继续使用。专用记住／再来仍走原card-clearance及单次完成流程，不用普通浏览的视口退场替代回插。
- 有效pointerdown立即捕获指针，5px仅保留起拖判定，避免首个快速move跨出局部容器后丢失后续事件；小点击、取消、命令接管及卸载继续释放捕获。输入事件即时写入当前卡位姿，松手使用最终坐标和最新速度，不增加延时门禁。
- down与首个move时间戳相同时保留down锚点，后续同时间戳事件仅替换末样本；90ms窗口、16ms速度计算下限、30%位移／700px/s阈值保持。方向投射恰好抵消位移时回退有效位移方向。当前选中卡在restore中也能接管拖动，从正在显示的位姿／旋转接续；切题判定只用此次指针位移，避免把卡片已有动画偏移误算为拖动距离。
- 窗口／可见视口resize取消旧路径，卸载同步清理；既有阻断、后台、重置和reduced-motion生命周期保持。新增视口几何及同时间戳回归用例，按用户要求未运行测试、构建或浏览器验收，实际手感仍待用户查看。上述内容是本项目明确修补，不声称逐字等同原附件。

来源：[React Bits Card Swap](https://reactbits.dev/components/card-swap)。采用用户在2026-10-19提供的TypeScript/Tailwind完整组件源码，SHA-256：`6bcb6cb409f24e4687900fe9c60f11523730c14c808ed124a2ad5c35c1d98912`。

`ui/CardSwap.tsx`为实际挂载的组件；`WordPronunciationDeck`通过`import CardSwap from './CardSwap'`和`<CardSwap>`传入现有`WordPronunciationCard`。保留原组件独立卡片实例、order/phase、requestAnimationFrame循环、integrate/scalar、松手速度采样、惯性、阻尼、nudge和stagger；未再使用外置`useWordPronunciationDeck`或自建弹簧Hook驱动动画。React Bits本身以复制源码组件的方式接入，不需要安装同名运行时整包。

本项目必要适配：有限前进/上一题、普通已看卡退出后隐藏、上一题恢复原卡片实例，专用再来动作按本节四层规则回插；子按钮排除拖动、卡面之外保留页面滚动、原有统一快捷键/设置及reduced-motion。2026-10-20按用户确认将章节完成与记住状态分开：进入末题不结束，末题再下一题退场后完成章节，无需全部记住；全部记住清空待练队列仍可完成。暂停保留实现但开发阶段统一关闭。原版切换开始即更新选中卡片，后卡补位和前卡退场继续在同一引擎中运行，不等待所有弹簧归零才接受下一次操作。卡面仍为500px原稿，`card-swap-sequence`提供有限边界，历史二维布局纯函数保留但不参与当前运动。

2026-10-19追加核对：删除封装中起拖和释放时的水平主轴限制，恢复原版全方向跟手、二维位移/速度判定和触屏旋转。`card-swap-gesture`原样维护二维释放公式，弹簧参数和5px起拖阈值未调大或调小。卡面使用touch-action:pinch-zoom，单指上下/左右由卡片处理，外围仍可滚动，保留双指缩放；原源码的touch-pan-y并不能保证浏览器触屏全方向拖动，这属于本项目明确调整。底栏和原快捷键按用户要求在拖动中保持可用，执行时通过interruptDrag释放当前手势并保留位姿，让同一引擎接续；末题收尾、暂停和浮层仍阻断。aria/inert及卡片角色属性只在实际变化时写入，不再逐帧删除/重建。前次“完整组件接入”不代表这些手势边界当时与原版一致，本条记录已确认的偏差与修正。

原speed=1、bounce=0.35、1.7/1.9频率、1/240秒细分、90ms窗口、700px/s轻甩、0.12秒投影、0.22预抬升和50ms补位延迟保留。关闭自动播放及默认图片/图标，悬停视差/展开已按上方当前参数恢复；不接入原版内部方向键，不采用固定画布缩放。React生命周期经shared动画入口管理，动画时钟经shared/lib/time；手势样本使用PointerEvent自带时间戳。没有新增依赖、后台请求、图片或持久化。

下列许可核对自[官方LICENSE.md](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)，2026-10-19；完整许可同时保存在组件源码中，仅作为应用内组件使用。

触屏捕获适配曾经原生CDP触屏输入复现：子图片隐式捕获转交root会发出冒泡的lostpointercapture，不能据此snap。监听只接受root自身、对应pointerId且已无捕获的事件，正常交接继续拖动。2026-10-20用户进一步复现快速鼠标轻甩时，buttons=0的lostpointercapture先于可消费的pointerup到达；此前一律interruptDrag导致超过150px仍直接回弹。现在pointerup／pointercancel通过document捕获接收，root丢捕获时通过`getCardSwapPointerEnd`区分按键已释放与真实取消：释放取最后有效轨迹走同一距离／速度判定，按键仍按住、显式取消、失焦或后台保持取消。先清state.drag再释放捕获，迟到up／lost不能重复切题。用户手动确认正常，Codex只读记录看到短于150px的约144px轻甩按速度成功切题及多个方向正常释放；已移除临时诊断代码。补了真实失败轨迹、取消和迟到坐标用例但按要求未运行，未自动拖动、测试或构建；平板／H5及Electron仍待对应验收。该监听与本次结束归一属于本项目修补，不声称原附件提供这些边界。

原附件只记录move且不记录up，快速轻甩只有一个move会变成零速度。后续修正采样生命周期：down/move（含可用的coalesced历史）/up共同进入90ms窗口，保留前置锚点并插值边缘；up最终坐标参与位移，停顿后旧速度失效。不改变原二维距离/速度阈值与积分函数。该处属于有回归证据的修补，不再声称速度采样实现逐字等同原附件；来源和许可原样保留。

专用`controller.dismiss(onComplete)`与普通next/previous和手势分开：先捕获当前索引，在原exit/gone弹簧轨道向上退场并补位，期间保留原children，不发onChange或onFinish。原卡完全不可见后先释放动作锁和回调，再由宿主一次提交剩余题目与有效索引；末张走同一个单次回调。取消、重置、阻断、后台和卸载均废弃待提交动作；reduced-motion可同步完成。`card-swap-dismissal`只管理待提交回调的互斥、单次取用和取消，不接管积分或题序。普通拖动期间的底栏可用规则与已有动画参数不变。

`controller.requeue(onComplete)`在用户后续要求下恢复原源码正向轮转：`dir=DOWN`，原卡退出到clearance后直接转rest、清top/hold并降至尾层，再由原弹簧从下方返回可见尾槽。旧实现的向右exit→gone淡出→尾槽瞬移已移除；`enter/under`是原源码反向轮转，未用于本动作。回插中的同一真实卡节点暂时豁免本项目有限题序的隐藏与停止积分，尾槽全部轴的位置/速度收敛后才交出单次完成回调，宿主再把其ID移到剩余队列末尾。当前显示槽最多四张，同一回插节点在业务重排后仍保持可见第4层，剩2/3张按实际数显示，不提前补第五张。它不调用普通有限题目导航，因此末卡再来也能从队首继续，且不增加记住进度。取消、阻断、尺寸变化与reduced-motion沿用原单次生命周期；记住up→gone和普通手势路径保持。

页面私有`allowFinish`默认`true`，单词拼读宿主已移除旧的`false`覆盖，复用末题退场完成语义：手势、下一题按钮与快捷键统一经`controller.next`，退场结束后`onFinish`交给宿主打开完成窗。普通进入末题不触发完成；收尾期间仍阻断重复切题，中断取消旧回调，reduced-motion直接完成一次。独立`dismiss`仍完成专用退场并提交记住删除，由宿主判定剩余队列是否为空；`requeue`保留再来回插，不冒充下一题完成。

## 许可原文

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, and distribute the Software as part of an application, website, or product, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

### Commons Clause Restriction

You may use this Software, including for any commercial purpose, so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.

### No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
