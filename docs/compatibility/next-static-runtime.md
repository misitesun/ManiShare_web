# Next 静态导出与 Electron 兼容性契约

2026-10-20声音扩展：resolver新增`.mp3 → audio/mpeg`，现有单区间传输同时覆盖MP3／WAV／MP4，Web静态预览与Electron共用；路径、CSP、缓存、RSC和失败资源边界保持。已补MIME及Range断言但按用户要求未运行测试、构建或真实解码，MP3兼容仍待用户验收；下方WAV／MP4的历史实测不等同MP3已通过。

- 适用范围：Next App Router output export、Client hydration、RSC预取与englishlearning协议。
- 已验证环境：2026-09-28 Node22.23.1、Next16.3.6/Turbopack、React19.2.8、Electron43.4.1。隔离PoC中 script-src self 阻断内联水合；逐HTML hash后事件、query恢复和Client导航成功，console error为零，document只初始加载一次。位图/SVG静态导入通过。
- 必须保留：每个HTML实际内联script生成CSP hash并与内容digest绑定；完整复制index.txt和__next.*.txt；RSC MIME为text/x-component，文件映射忽略query；未知资源严格404；Server序列化props与Client函数装配；useSearchParams局部Suspense。
- 禁止简化：只复制HTML、对任何未命中返回首页、script unsafe-inline/unsafe-eval、所有页面禁用SSR、混合公共barrel全局use client、以文件断言代替真实水合。
- 入口：electron/renderer-contract.ts、src/fsd/app/router、scripts/run-next.mjs、scripts/finalize-export.ts。主题/Storage bootstrap仍经各owner根入口。
- 自动化验证：pnpm run test、typecheck、双环境build、desktop:build、runtime:smoke（生产HTML/CSP/RSC/深链与事件）。
- 人工复测：PC1440×900比较页面布局/侧栏、查询视图、主题/持久化、弹窗与内部滚动；平板/H5视觉真机由用户验收。
- 替换条件：升级Next/Electron时必须在相同严格CSP及资源404契约下跑通真实生产运行时，确认新的RSC文件命名/MIME与导航没有整页回退后再更改方案。

## 练习技术媒体与静态 MIME

- `public/practice-demo/technical-tone.wav` 与 `technical-video.mp4` 是自行生成的固定同源技术片段，页面通过 `PracticeMedia.source` 注入并明确标注“技术验证片段，非课程音视频”。来源和格式见 [样例说明](../../public/practice-demo/README.md)，不替代正式课程音源、视频或设置音色。
- `electron/renderer-contract.ts` 的 `resolveRendererFile` 统一将 `.wav` 映射为 `audio/wav`、`.mp4` 映射为 `video/mp4`；严格 Web 预览和 Electron `englishlearning` 协议共同消费。无 hash 的 public 文件保持重新验证缓存，缺失媒体继续返回非 HTML 的404，路径/真实路径校验保持。
- 静态类型与下述范围传输由 host 提供；CSP 仍由现有 `default-src self` 限定同源媒体，未放宽 script、blob/data 媒体来源或增加 Electron preload/IPC bridge，renderer 不使用 Node 能力播放。正式 CDN/网关也需提供准确 MIME 和同版资源。
- `electron/renderer-contract.test.ts` 保留两种 MIME 断言及既有资源404/路径/CSP测试；练习媒体控制器测试覆盖加载、播放失败、互斥和清理。单测替身与文件存在不证明浏览器实际解码成功，须在实际静态产物与严格CSP下读取真实媒体事件、错误和进度。
- WAV 只证明该采样格式的音频路径；两秒静音 H.264 MP4 不证明音轨或正式课程视频兼容。PC Web/Electron 真实播放、自动播放限制及退出清理按实际运行结果记录；平板/H5播放、触摸、系统音量和真机兼容仍待用户验收。未来加入其他编码/封装时先验证 MIME 与真实解码，不通过回退HTML或放宽CSP解决。

## 本地 WAV / MP4 单区间传输

- **事实与适用范围**：2026-10-15 的生产隔离窗口中，自制 WAV 已能真实加载和播放、音量与倍速也生效，但缺少范围响应时 `seekable` 为 `[0,0]`，拖动进度后仍回到 0。因此“播放成功”不能替代进度定位验收。当前仅对 `resolveRendererFile` 成功解析的 `audio/wav` / `video/mp4` 文件、GET / HEAD 请求启用字节区间；不泛化到其他媒体格式或全部静态资源。
- **唯一实现**：[media-byte-range.ts](../../electron/media-byte-range.ts) 负责单区间解析、响应计划与指定字节读取，[Electron host](../../electron/main.ts) 和 [Web 静态预览](../../scripts/preview-export.ts) 共同消费。读取路径必须先通过既有 resolver，范围头不参与路径解析；真实路径、符号链接逃逸、隐藏文件、API / 资源404、信任 host 和 CSP 校验保持原边界。
- **响应规则**：没有 Range 时返回 200，声明 `Accept-Ranges: bytes` 和完整 `Content-Length`；合法 `bytes=start-end`、`bytes=start-`、`bytes=-suffix` 返回 206，`Content-Range: bytes start-end/total` 与实际响应体字节数一致。结束位置超过文件时夹紧，后缀超过文件时返回整个文件对应的 206 区间；数字先以整数范围处理，不能溢出后回绕。
- **拒绝与 HEAD**：非法、不支持的多段、起点越界、起点大于终点及零长度后缀返回 416，带 `Content-Range: bytes */total`、`Content-Length: 0`，无响应体。空文件无 Range 时为 200 / 长度 0，有 Range 时为 416。HEAD 使用同一状态与长度 / 区间头，但不读取和发送文件体。
- **其他资源**：HTML、RSC、JS、CSS、图片等不启用该分支，Range 头不会使它们被切片；Next 的页面 HEAD 预取、目录规范化、查询忽略及原有 MIME / 缓存行为继续保持。缺失媒体在范围处理前已经返回非 HTML 的404，不得用 206、200 或首页回退掩盖资源缺失。
- **部署要求**：正式静态服务器 / CDN 必须给 WAV / MP4 提供正确 MIME、字节长度和可定位的单 Range 响应，保留 206 / `Content-Range` / `Content-Length` / `Accept-Ranges`，HEAD 无体；不能把区间请求无条件改写成 200 全量响应。已部署服务需以真实 `currentTime`、`seekable` 与媒体事件复测，不只检查文件可下载或播放器时长。
- **验证与限制**：[区间测试](../../electron/media-byte-range.test.ts) 验证三种区间、夹紧、超长数字、206 / 416、HEAD、空文件、实际读取字节与截断拒绝；[resolver 测试](../../electron/renderer-contract.test.ts) 继续覆盖 MIME、RSC、路径和真实404。替身 / Node Response 测试不替代 Web 和 `englishlearning` 协议实播；生产 PC 复测由 `runtime:smoke` 的练习检查记录，平板 / H5 真机仍待用户验收。本地实现不增加跨源媒体、缓存系统或 preload / IPC 能力。


## 练习固定底栏与命令按键

- 五项快捷键偏好仍经learning-settings和shared存储公共入口恢复，首次预渲染保持确定默认值，挂载恢复后才启用命令，不在renderer直接读取Storage。旧v1数据补切题默认；本轮在挂载恢复时将五项旧绑定的Ctrl修饰键一次迁移为Shift，保留主键及其他修饰键、去重并按统一顺序保存到原v1键。转换冲突值保留并可见停用，不静默回默认；预渲染仍不读写Storage。
- 单一监听区分作答输入、普通编辑器、原生控件和最上层浮层；一次Enter / Space只由原生按钮或命令入口消费，长按和IME不重入；keyup / blur释放held。切题清理媒体和口语演示状态，旧任务不可继续推进新题。作答输入内Ctrl / Meta+A/C/X/V/Z/Y（含Shift组合）继续原生编辑，仅Shift+字符（包括大写字母，且无Ctrl / Alt / Meta）保留原生输入；这类绑定只在允许的非编辑作用域触发；作答Enter与显式切题继续按原有作用域规则处理。
- 固定底栏保留100px及安全区占位；局部横向滚动不制造页面横向溢出。顶部答案 / 音标讲解的显隐与答题phase分开，动画尊重reduced-motion。
- Web静态预览与Electron协议在隔离会话中复测，同源样例媒体及CSP不变。当前默认朗读 / 掌握 / 不熟为Shift+L/J/K，切题为Shift+←/→；设置允许Shift+字母、禁止新录入Ctrl练习绑定，Alt / Meta / 功能键仍可用。旧Ctrl默认的历史验收不能替代本轮Shift及迁移验收，剩余宿主 / 系统保留组合仍需在真实宿主验证，Electron中HTTP页面通过不能替代所有宿主结论。平板 / H5真机输入法、系统软键盘和外接键盘继续待用户验收。
- 练习计时首次预渲染 / 水合固定为零，单调时钟只经`shared/lib/time`在effect启动或事件中读取；250ms任务只是检查展示秒数，不以回调次数计时。暂停保留毫秒余量、继续另起单调时间段，不补算暂停时间；切题保留累计，重置 / 换游戏或小模式从零开始。当前开发阶段由页面私有`PRACTICE_PAUSE_ENABLED = false`停用游戏暂停：不注册暂停用的blur/visibility监听、不开放顶部/菜单暂停，Esc不进入暂停，后台挂载和窗口返回不要求“继续游戏”；计时及媒体仍遵守设置/退出/完成等原浮层阻断。以下窗口暂停规则仅在后续恢复开关后适用：窗口blur或标签hidden时同步冻结计时、媒体与口语演示，后台挂载不能启动任务；返回不自动继续，只接受显式继续意图，退场期间再次离开会取消该意图。暂停与原浮层独立，保留输入／题态及媒体位置；解除暂停后仍尊重原浮层阻断。卸载清除计时和两类事件监听并阻止旧队列回调更新，StrictMode effect重放可重新启用且不重复创建任务。全模式仅计时文本订阅更新，不重挂媒体、不请求接口、不写Storage；不将其当作正式学习时长上报。窗口／后台专项的原生验证、事件注入及前台仿真分别见练习开发文档“暂停弹窗与窗口自动暂停”。
