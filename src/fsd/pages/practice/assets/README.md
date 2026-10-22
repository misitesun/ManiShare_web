# 练习页设计资源

## 句子拼块撤回与清空（2026-10-22，已同步本地main）

`sentence-blocks-undo.svg`来自Figma `z7SIwUb9ep0j0ZaEwFrxJl`／`546:34534`，`sentence-blocks-clear.svg`来自`546:34530`，均通过`download_figma_images`导出并原样保留30×30根尺寸。仅`SentenceBlocksExercise`消费，托盘右上12px、间距10px；图标不随H5／平板的40px触控区域拉伸，沿现有dialog-icon主题filter。设计整页1920×1080导出仅存main ignored `.next/figma-sentence-blocks-20261022`供只读核对，不参与实现。题图、词块主题token和答对后的听力／笔记／口语图标直接复用既有资源；不重画SVG、不新增主题色。两份原SVG已按用户确认定向同步本地main，按用户要求未做运行视觉验收。此记录覆盖下方历史拼块“两题／占位提交／旧结果布局”的描述。

## 句子阅读显示箭头（2026-10-22）

`sentence-reading-display-arrow.svg`由用户确认的Figma `z7SIwUb9ep0j0ZaEwFrxJl`／`1696:8760`通过`download_figma_images`导出，保留20×20根尺寸及原始图形。仅`SentenceReadingDisplay`在“显示”文字后使用，间距2px，沿既有dialog-icon主题filter；替代原CSS小箭头，不改其他控件资源。完整设计导出仅在ignored `dist/design-review/sentence-reading-20261022`用于只读设计核对，不参与页面实现。本资源已随用户确认的句子阅读修正同步到本地main；按用户要求未做实现后运行验收。

## 阅读全览播放资源（2026-10-21）

用户Downloads的`Frame.svg`／`Frame (1).svg`原样复制为`sentence-reading-play.svg`／`sentence-reading-pause.svg`，保留28×28根尺寸及viewBox。临时黑底渲染核对为圆圈三角／圆圈双竖线，生产SVG不修改图形或颜色。`PracticeFooter.playback`仅由句子阅读注入状态，按播放或自动切题（含1.5秒等待）切换，白色图形沿dialog-icon主题filter；其他模式默认图形不改。右上三项复用沉浸听力24px原图及开启态，笔记复用`sentence-listening-note.svg`原20px资源，不重复复制。用户确认句子预览后已同步main，保留音频等现有消费者和资源；本次未做项目运行验收。

## 笔记侧栏（2026-10-20）

`notes/`八份素材直接取自Figma `z7SIwUb9ep0j0ZaEwFrxJl` 的 `546:35888/36010`：标题`546:35990`（30×30）、关闭`546:35983`（24×24）、空态图`546:35995`（原图1536×1024，设计槽156×104）、书写`546:36134`、编辑`546:36147`、删除`546:36150`、修饰键`546:35999`及回车`546:36005`（后五项均18×18）。全部由`PracticeNotesPanel`静态导入，SVG根宽高不覆盖；关闭沿既有图标filter适配浅色，原彩色功能图标保留。两份完整画板预览只在ignored `dist/figma-inspection/practice-notes-20261020`作设计核对，不作为业务资源或渲染结果。

## 既有资源说明

2026-10-20：拼读的`word-card-guideline.svg`在原路径、1px高度与虚线图形基础上增加`preserveAspectRatio="none"`。`WordPronunciationCard`在全部视口按实际英文宽度伸展四线，不再仅在设计断点显示；其他图片、图标和配色资源保持原实现。按本轮用户要求未运行测试、构建或视觉验收，效果待用户查看。

- 暂停弹窗：`pause/mascot.png`为Figma `2398:5700`原始图片（imageRef `fbe4ac6b7ee90678969c806d65498a62be3808e0`，1396×1127），按106×86、object-cover显示；`pause/close.svg`来自`2094:20266`，保留20×20及原路径。关闭SVG与完成窗素材的坐标不同，未用近似图替代。完整父节点`2094:20061`导出仅存ignored `dist/design-review/practice-pause-reference.png`作验收参考，不作实现背景。

- 内容弹窗：`content-arrow-right.svg`来自546:35563，保留24×24根尺寸，放在卡片右下角。546:35546关闭图标与现有`error-feedback-close.svg`的SHA256一致，直接复用；两图均通过既有`--app-filter-dialog-icon`适配主题，不改写路径。546:35451设计导出仅存于被忽略的`dist/design-reference/practice-content-reference.png`作为QA参考。

来源均为用户提供的Figma文件z7SIwUb9ep0j0ZaEwFrxJl，经get_figma_data读取、download_figma_images导出；未从参考站下载课程素材。图片和SVG用于自身设计槽位，不以整页截图实现页面。

- `error-feedback-close.svg`：546:35721，保留24×24原始根尺寸，用于错误反馈右上角，40px可点击区域。紧凑选框两态与加号归真实共享控件owner：`tld-selection/assets/ring-checked.svg`（546:35729）/`ring-unchecked.svg`（546:35754）、`tld-image-upload/assets/add-outlined.svg`（546:35769）；不重画路径。整页设计导出只保存在被忽略的`dist/design-reference/practice-error-feedback-reference.png`作为QA参考，不参与实现。

- word-toolbar-clock.svg / word-toolbar-options.svg：546:31247 / 546:31274，均保留18×18原始根尺寸，用于六模式左上角计时与六边形局部设置。
- word-toolbar-popover-arrow.svg：546:31458，导出SVG根尺寸11×6（设计几何10.39×6）；用原轮廓mask和语义表面色绘制，深浅主题箭头与浮层同色，不重画路径。工具栏来源为546:31237、31334、31470、31574、31762、31837，相关控件未使用整屏截图。

- word-woman-e23d5f.png：546:31277，原文件2784×1392保持；单词六模式运行时统一在16:9封面容器内以`object-cover`等比裁切，拼读／拼写最大宽500px，其余430px，平板／H5随可用宽度等比缩小。稿面500×281为整数参考，不作为实际显示比例。
- reading-scene.png：546:33666；句子游戏题图。
- picture-scene.png：2655:11089；看图听力，原图已含静态遮罩/目标描边。
- greeting-scene.png：2651:10419，同2651:10098的浴室场景；文件名沿首次导出，非另造问候题图，原稿指法Nice to meet you与此图是设计占位组合。
- audio-cover.png：546:43542；纯音频封面496×280。
- picture-reader.png：546:43589；纯图片主体1100×733（原稿另有渐变覆盖，当前未补齐）。
- 顶栏SVG：I546:31241;257:6750/6756/6764/6772/6778/6784/6790/6799，对应答案/内容/模式/暂停/重置/报错/草稿/设置；返回6809为26×26，全屏6803为30×30；根尺寸保留。
- known.svg/retry.svg：546:31286/31289，均66×66。
- word-card-gradient-border.svg：546:31320，原始500×500透明描边，1px、20px圆角；136°紫→白（49%）→绿渐变，未改写路径或色值。
- word-card-back-far.svg / word-card-back-near.svg：546:31238/31239，492×444 / 492×472；保留原始24px圆角、1px渐变描边。移除独立的实色底矩形，将同一原稿深色交给`practice-deck`语义token绘制，使light可使用已有表面回退；没有改写描边停点或路径。基准相对前卡偏移分别(36,28)/(22,14)，描边透明度分别0.4/0.6。
- word-card-play.svg：546:31278完整32×32播放按钮；word-card-note.svg：546:31326文档图标，2026-10-20按用户纠正识别为解析入口，历史文件名保留，拼读消费名为analysisAsset；word-card-lookup.svg：546:31283放大镜查词；word-card-add.svg：546:31331添加，后三项同为32×32。解析背面的返回／查词／耳机采用继承语义文字色的内联SVG，不复制哇学社课程资源。
- phonetics-word.png、phonetics-word-play.svg、phonetics-sound-play.svg、phonetics-note.svg：546:41847/41848/41894/41901；题图为understand三格漫画，播放与笔记分别保留36/20/58px原尺寸。

单词拼读卡：546:31313释义的18px字号、400字重及18px行高已落实；未将此行高套给未核实的其他文字。546:31240原始投影为0 0 50 0 rgba(92,255,198,0.25)，当前沿用全局对应语义token的绿色光晕；未找到可核实的紫色投影数值，不新增猜测。卡片只使用独立背景/描边及图标节点，不把500×500整张内容画面导出后充当实现。上述尺寸和坐标对应1920×1080、默认字号且显示图片的基准；非默认字号或隐藏图片继续自然排版，装饰随卡片容器适配，不承诺该状态与基准坐标相同。

## 单词拼写与默写

`WordAnswerCard` 只负责卡片/题面，父级需按真实画板放置：拼写546:31334的前卡为500×500@(710,228)，复用透明500×500描边、500×281题图及32px辅助图标，不添加该画板没有的两层背卡。2026-10-19用户确认改用哇学社截图的整词输入显示，旧546:31398的28×2灰线资源已删除；五条固定装饰线及156px组宽不再作为当前验收值。`PracticeWordSlotsInput`使用透明文字自然撑宽与语义边框，自定义字号/边框继续由Props传入；原卡面、题图和辅助图标保持。

拼写音标组546:31363为188×36@(866,588)，五音素框28×30、间隔4；释义546:31376为195×25@(870,645)、18px/400。该节点未返回固定行高，因此未套用拼读卡的18px行高。输入统计区546:31386/31396虽可读取385×68@(767,896)和演示数字，但面板效果节点本次未能导出，当前新卡未实现这块，不伪造实际输入统计。

默写546:31470没有拼写的500px卡片：初始题图430×242@(745,220)，200×3输入线@(860,610)，261×34释义@(829,696)、24px/500。揭晓1609:7642保留430×240题图，并展示430×173@(745,110)答案提示；提示内部字体/几何来自1609:7831/7835/7839，但正文使用当前question，不混入旧Women词条，长释义按真实数据重排。新答对态2389:5125不画题图：30px音标@(892,360)，40px英文@(891,422)，137×3下划线@(891,473)，24px/500释义261×34@(830,506)。英文原稿MaoKenTangYuan字体未有本地可用证明，继续使用用户已选字体及系统回退；未伪称字体一致。答错保留原生输入；无keydown、自动提交、判题、请求或学习统计写入。

彩色键盘以真实键位绘制，双手几何见下节；动态场景区域尚缺，不把2710:11093的含题图/题干整张参考图片当键盘。自制播放技术样例属于固定URL，来源及限制另见public/practice-demo/README.md。

## 句子中译英、理解自查与选词拼块

`SentenceExercise`复用`reading-scene.png`，仅承载句子族的这三种模式。1920×1080、默认文字/语法字号且打开图片时，局部槽位按`reference-layout.ts`中已读取的画板坐标定位；其余视口及自定义字号/隐藏图片状态使用自然流和换行，不缩放整张画布。

- 中译英546:33717：题图430×242@(745,336)、中文30px/500@(856,602)；546:33828–33831四根3px底线位于y723，宽59/83/112/157、间隔38/25/25，整体499px。保留一个原生输入进行本地编辑，底线只是独立装饰层，不拆字判题或监听快捷键；可见技术label改为屏幕阅读器说明。源稿为空输入，输入后字号暂沿40px显示角色与设置字号，输入行高/原生控件高度没有来源，未冒称精准还原。
- 理解自查546:33970：题图430×242@(745,245)、英语40px/500自y532开始；546:34043按钮186×58@(867,635)、r8、文字18px/400。按钮只触发既有演示揭晓动作，不接空格等全局按键。初始态不暴露中文译文。
- 选词拼块546:34436：题图430×242@(745,157)、中文40px/400自y449开始、794×163托盘@(563,565)、候选行y817；已选行gap30、候选gap40，词块64px高，reading样例we/read/books/together宽78/100/132/154。文字默认38px/400，候选together为34px；样例候选顺序取read/together/we/books，选择内容仍完全由本轮session决定。托盘157°紫→白53%→绿边框和词块底色/边框/阴影经全局语义token提供，未新增位图。
- 揭晓/答对仅使用源546:33834、546:34045、546:34554的已读取几何：不展示题图，解析组从y316、中文从y559开始；内部逐词解析继续复用`AnnotatedText`，其内部全部字体框/行高尚未逐项还原，不能将组槽位定位称为逐词像素级完成。答错保留输入或本轮已选词块，不自动展示答案。

以上TEXT框高不替代行高；缓存没有明确返回的行高继续保持未核实。句子示例正文已按原稿统一，不在组件层删除句号或改写答案；主句首词的TITLE显示交给`AnnotatedText`的明确展示变体，词块保留原始小写。正式内容变长时按实际内容重排，不用固定字框裁切文字。

### 指法双手几何

`typing-hand-shapes.ts`从用户指定参考项目`/Users/sly/Downloads/waxueshe-client-web-optimize/src/assets/game/hands.svg`提取54套手型/424条路径，供页面私有`TypingHands`渲染。只保留几何及角色，移除旧主题CSS、颜色、全局选择器和显示控制；实际填充/轮廓/指尖提示均消费全局`practice-hand-*`语义token。左右手独立切换；Space保留左手，CapsLock无专属源手型时明确使用相邻小指示意。标签在手层上方，手层统一0.45透明且不接收事件，不把整屏效果截图作为键盘。


## 句子沉浸听力

开启态补齐（2026-10-21）：用户下载目录`☁️ManiShare (1)`提供`盲听打开.svg`、`自动切题.svg`、`章节循环.svg`、`播放.svg`、`自动下节.svg`，原样复制为`sentence-listening-blind-on.svg`、`sentence-listening-auto-advance-on.svg`、`sentence-listening-chapter-loop-on.svg`、`sentence-listening-play.svg`、`sentence-listening-auto-next-chapter-on.svg`。五份均为原始24×24／viewBox 0 0 24 24，未改写根尺寸、图形或颜色；绿色开启态不应用白色图标的主题反相filter，盲听眼睛与播放三角为白色图形，继续沿原filter适配主题。当前`SentenceListeningControls`按真实开关／播放状态选择对应资源，以图形本身呈现状态，替代初版仅切换绿色背景与描边的表现；提示使用项目Tooltip，资源继续属于practice。

SentenceListeningExercise复用reading-scene.png（546:33666），显示430×242。sentence-listening-note.svg来自546:33713，原根20×20；sentence-listening-oral.svg来自546:33660，原根28×28，保留导出图形和根尺寸，沿既有dialog-icon filter适配浅色主题。专用SVG随听力专用组件／测试留在practice页面内部；公共标注和几何按共用能力维护。546:33709中文尾部动作仍待确认。

2026-10-21用户确认右上五控件语义后，从Figma原稿546:33667实例的Frame 2147236746子组逐个按1×SVG导出：`sentence-listening-blind.svg`（源组件子节点3318:3304）、`sentence-listening-auto-advance.svg`（3318:3308）、`sentence-listening-chapter-loop.svg`（3318:3311）、`sentence-listening-pause.svg`（3318:3316）、`sentence-listening-auto-next-chapter.svg`（3318:3319）。全部保留原始24×24根尺寸／viewBox与图形，不描摹用户截图；`SentenceListeningControls`按此顺序消费，以原有dialog-icon filter适配主题、按钮背景与描边表示开关状态。组基准204×34@(1716,95)，H5／平板扩大按钮触控目标，图标仍24px；资源不提升到全局目录。

2026-10-21音频听力复用：`reading-scene.png`、`sentence-listening-note.svg`、听力五控件的关闭／开启态SVG及口语入口由句子／音频沉浸听力共同消费，仍属于practice同一page。通过family区分语义与设计节点，不复制、重绘或提升为全站资源；原24px图标与题图比例保持，本轮未执行视觉或运行时验收。
