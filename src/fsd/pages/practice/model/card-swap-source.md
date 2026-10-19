# CardSwap组件直接接入

## 当前四层展示适配（2026-10-19）

用户后续确认恢复原组件四张展示、3D透视与hover。当前参数统一为visible=4、cardDistance=32、verticalDistance=2、depth=80、perspective=900、parallax=0.5和hoverSpread=0.12，沿原`q*dx*spread / -q*dy*spread / -q*dz`位姿及原弹簧运行。主卡尺寸与内容保持，后卡不再使用Figma二维非等比缩放，旧的关闭hover说明仅代表前轮状态。

业务数组与展示槽分开：普通导航仍按业务有限顺序；再来将真正后续题目与当前卡组合为至多四张展示牌，旧卡DOWN清出→降层→回插到可见末槽，且不提前补第五张；宿主完成后再把ID写入业务队尾。物理节点绑定稳定key，以成员集合身份而非业务顺序重建，业务重排不销毁回插节点。后续动作重新按真实业务顺序补位，上一题/记住不混入视觉轮转。与原四项循环示例的差异仅为本产品的有限题序/完整队列契约，不声称原组件自身提供这些业务规则。

隐藏节点的transform归零，局部动画视口裁切溢出，防止不可见退场卡扩大页面高度。PC主卡500px、rAF积分/阻尼、二维速度阈值与全角度跟手不改；hover仅用于非触屏且无reduced-motion。阶段、清理、兼容与真实DOM验证见开发文档“四张展示”节，下文保留来源、许可和前轮适配记录。

来源：[React Bits Card Swap](https://reactbits.dev/components/card-swap)。采用用户在2026-10-19提供的TypeScript/Tailwind完整组件源码，SHA-256：`6bcb6cb409f24e4687900fe9c60f11523730c14c808ed124a2ad5c35c1d98912`。

`ui/CardSwap.tsx`为实际挂载的组件；`WordPronunciationDeck`通过`import CardSwap from './CardSwap'`和`<CardSwap>`传入现有`WordPronunciationCard`。保留原组件独立卡片实例、order/phase、requestAnimationFrame循环、integrate/scalar、松手速度采样、惯性、阻尼、nudge和stagger；未再使用外置`useWordPronunciationDeck`或自建弹簧Hook驱动动画。React Bits本身以复制源码组件的方式接入，不需要安装同名运行时整包。

本项目必要适配：有限前进/上一题、普通已看卡退出后隐藏、上一题恢复原卡片实例，专用再来动作按本节四层规则回插；子按钮排除拖动、卡面之外保留页面滚动、原有统一快捷键/设置及reduced-motion。单词拼读只有全部记住才完成，暂停保留实现但开发阶段统一关闭。原版切换开始即更新选中卡片，后卡补位和前卡退场继续在同一引擎中运行，不等待所有弹簧归零才接受下一次操作。卡面仍为500px原稿，`card-swap-sequence`提供有限边界，历史二维布局纯函数保留但不参与当前运动。

2026-10-19追加核对：删除封装中起拖和释放时的水平主轴限制，恢复原版全方向跟手、二维位移/速度判定和触屏旋转。`card-swap-gesture`原样维护二维释放公式，弹簧参数和5px起拖阈值未调大或调小。卡面使用touch-action:pinch-zoom，单指上下/左右由卡片处理，外围仍可滚动，保留双指缩放；原源码的touch-pan-y并不能保证浏览器触屏全方向拖动，这属于本项目明确调整。底栏和原快捷键按用户要求在拖动中保持可用，执行时通过interruptDrag释放当前手势并保留位姿，让同一引擎接续；末题收尾、暂停和浮层仍阻断。aria/inert及卡片角色属性只在实际变化时写入，不再逐帧删除/重建。前次“完整组件接入”不代表这些手势边界当时与原版一致，本条记录已确认的偏差与修正。

原speed=1、bounce=0.35、1.7/1.9频率、1/240秒细分、90ms窗口、700px/s轻甩、0.12秒投影、0.22预抬升和50ms补位延迟保留。关闭自动播放及默认图片/图标，悬停视差/展开已按上方当前参数恢复；不接入原版内部方向键，不采用固定画布缩放。React生命周期经shared动画入口管理，动画时钟经shared/lib/time；手势样本使用PointerEvent自带时间戳。没有新增依赖、后台请求、图片或持久化。

下列许可核对自[官方LICENSE.md](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)，2026-10-19；完整许可同时保存在组件源码中，仅作为应用内组件使用。

触屏捕获适配另经原生CDP触屏输入复现：子图片隐式捕获转交root会发出冒泡的lostpointercapture，不能据此snap。监听只接受root自身、对应pointerId且已无捕获的真实丢失；这种意外丢失以保留位姿的回弹处理，正常交接继续拖动。该监听是封装新增，原附件没有此取消分支。

原附件只记录move且不记录up，快速轻甩只有一个move会变成零速度。后续修正采样生命周期：down/move（含可用的coalesced历史）/up共同进入90ms窗口，保留前置锚点并插值边缘；up最终坐标参与位移，停顿后旧速度失效。不改变原二维距离/速度阈值与积分函数。该处属于有回归证据的修补，不再声称速度采样实现逐字等同原附件；来源和许可原样保留。

专用`controller.dismiss(onComplete)`与普通next/previous和手势分开：先捕获当前索引，在原exit/gone弹簧轨道向上退场并补位，期间保留原children，不发onChange或onFinish。原卡完全不可见后先释放动作锁和回调，再由宿主一次提交剩余题目与有效索引；末张走同一个单次回调。取消、重置、阻断、后台和卸载均废弃待提交动作；reduced-motion可同步完成。`card-swap-dismissal`只管理待提交回调的互斥、单次取用和取消，不接管积分或题序。普通拖动期间的底栏可用规则与已有动画参数不变。

`controller.requeue(onComplete)`在用户后续要求下恢复原源码正向轮转：`dir=DOWN`，原卡退出到clearance后直接转rest、清top/hold并降至尾层，再由原弹簧从下方返回可见尾槽。旧实现的向右exit→gone淡出→尾槽瞬移已移除；`enter/under`是原源码反向轮转，未用于本动作。回插中的同一真实卡节点暂时豁免本项目有限题序的隐藏与停止积分，尾槽全部轴的位置/速度收敛后才交出单次完成回调，宿主再把其ID移到剩余队列末尾。当前显示槽最多四张，同一回插节点在业务重排后仍保持可见第4层，剩2/3张按实际数显示，不提前补第五张。它不调用普通有限题目导航，因此末卡再来也能从队首继续，且不增加记住进度。取消、阻断、尺寸变化与reduced-motion沿用原单次生命周期；记住up→gone和普通手势路径保持。

页面私有`allowFinish`默认`true`，保留原末题退场完成语义；单词拼读宿主设为`false`，普通末题下一题/手势不退场或触发完成，拖动释放由原弹簧回到原位。独立`dismiss`不受此选项限制，末张记住仍完成专用退场并提交删除，由宿主判定剩余队列是否为空。

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
