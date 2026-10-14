# 测试规范

测试按模块能力与可验证行为组织，不按页面数量组织。

## 1. 归属

测试与被测概念就近放置：

```text
entities/course/
├── api/
│   ├── parse-course.ts
│   └── parse-course.test.ts
└── model/
    ├── course-progress.ts
    └── course-progress.test.ts
```

一个测试文件验证一个可命名概念。测试公开输入、输出、状态与用户可观察行为，不测试私有变量、Tailwind class 或实现顺序。

## 2. 必须测试

- API 外部数据校验和 DTO 到领域模型转换；
- 状态转换、权限判断、提交参数构造和错误映射；
- 学习进度、积分、复习调度等领域公式及其单位、边界、精度与舍入；
- 可复用 shared 能力；
- 已确认的兼容性降级、清理或恢复；
- 缺陷修复的复现路径。

纯路由组合、静态壳层和无逻辑视觉页面通常不写单元测试。

## 3. 当前能力

`pnpm run test` 使用 Node 的 TypeScript runner 执行 `src/**/*.test.ts` 与 `electron/**/*.test.ts`，并执行环境、资源及源码契约脚本测试。部分 UI 公共契约使用静态 React 渲染验证；生产交互由下述 `runtime:smoke` 覆盖，完整业务 DOM/E2E 在需求明确后补充。

## 4. 写法

- 测试名称描述行为与条件。
- 正常、边界、失败路径放在同一概念文件中。
- 不依赖执行顺序，不共享可变全局状态。
- 外部时间、随机数、浏览器状态通过明确输入或能力边界隔离。
- 不用源码字符串扫描代替行为测试；架构/lint 规则可使用静态检查。

## 5. 提交前

接口接入或加载行为变更按[接口能力边界](api-capability-boundaries.md#验证证据)验证缺失字段处理、请求来源与次数。使用受控请求替身覆盖缺项不触发未授权补全、列表不产生逐条详情请求、复用组件不引入无关请求或状态写入。按已确认的触发条件断言，不机械规定全页面只允许一次请求；已有分页、详情查看等合法请求保持需求约定。没有真实联调环境时明确说明证据范围。

```bash
pnpm run format:check
pnpm run test
pnpm run lint
pnpm run build
```

`pnpm run lint` 会再执行 `format:check`，单独列出是为了让格式偏差在完整 lint 前快速失败。涉及 Electron 时再执行 `pnpm run desktop:build`。浏览器与设备体验无法由当前测试覆盖时，在交接中列出实际复测视口与未复测项。Codex 的人工视觉验收只覆盖 PC（优先任务指定的桌面尺寸，未指定时为 1440×900）；平板与 H5 的视觉、横竖屏和真机兼容统一列为待用户验收，不得记为已通过。

## Next 与 FSD 运行时契约

- Next 16.3.6 / Turbopack 是唯一框架入口，`output: 'export'`、`trailingSlash: true`；不运行 Next Server，不使用 API Route、Server Action、cookies/headers 或按请求渲染。
- 六层业务位于 `src/fsd`；`src/app` 只放 Next 路由、layout、Metadata 和错误边界。FSD 不反向导入适配层。
- Server page 只 await params 并传序列化 ID/字符串。路径构造回调在 `src/fsd/app/router` Client 装配。跨 slice 使用根 index；混合公共入口不加 use client；枚举器不得依赖浏览器。
- Client Component 仍参与预渲染；首次渲染禁止读取浏览器存储/视口或使用随机值。偏好、Portal 和动画在挂载后恢复。`useSearchParams` 放在最近的 Suspense 边界下，视图 replace 保留其他查询参数并使用 scroll:false。
- 图片导入在 owner 内转换为 `.src`，保持 UI/model 的 string URL 契约。主题首次绘制脚本由 shared/theme 与 shared/lib/storage 生成；仅 html 的主题属性允许窄范围 hydration warning 抑制。
- 根 tsconfig 保持 strict 与 Next 类型生成；Electron 用独立 tsconfig。新路由同步枚举测试、静态产物集合和部署文档。
- 类型、文件断言与真实水合/导航验收分开记录。Tablet/H5 视觉和真机仍待用户验收。

## Production 运行时冒烟

设计任务另按[ADR 0018](decisions/0018-reference-fidelity-and-responsive-reflow.md)分两段验收：基准CSS视口/100%缩放下读取字号、行高、字重、字距、实际文字间距、控件尺寸及DOM位置并与Figma逐项比较，保存截图；再检查较窄/超宽PC、真实125%/150%/200%浏览器页面缩放的重排、焦点和溢出。缩小viewport只证明对应布局分支，不能冒充真实页面缩放测试；源码/class断言也不能代替计算样式。H5/平板只做布局计算检查时须明确区分，视觉与真机仍待用户验收。已确认字体回退和真实数据与设计占位的差异单列。

设置页以独立来源记录测试逐项核对七Tab字段、完整选项顺序和数值范围。运行时实际修改全部选择项、滑块、开关、单选和三个快捷键，跨Tab修改后逐页刷新确认恢复；核对Tab查询保留、三个颜色确认保存与刷新恢复、取消、颜色重置后再刷新及预览计算样式，重置不影响其他外观设置或主题。PK首页增加轮播选择、房号筛选/无结果/清空、榜单指标、取消后我的创建与大厅同步、重新进入恢复示例，以及入口未开放提示。Web/Electron各访问28条路由代表实例，使用隔离测试配置，避免覆盖用户本机偏好。PC截图保存在被忽略的dist/settings-web-pc.png、dist/settings-electron-pc.png及dist/pk-web-pc.png、dist/pk-electron-pc.png。平板/H5仍待用户验收。

生产冒烟每次使用独立临时 Electron userData，退出后由 runner 清理，避免测试偏好影响用户或后续运行。页面和截图统一中文，不再操作语言选择器；隔离配置中注入旧英文存储值后刷新，验证界面仍保持中文、语言入口不存在且控制台无水合错误。

完成双环境构建后运行 `pnpm run runtime:smoke`。脚本自动启动严格静态预览和 Electron hidden sandbox 窗口，加载实际 host/preload/protocol，分别遍历28条路由的代表实例，并验证水合、query、父级返回、壳层滚动与前进/返回、AI场景草稿/内部滚动及离开重置、主题及学习设置持久化、PK大厅本地交互、IPC、未知页面和资源/API 404。结果写入被忽略的 dist/runtime-smoke.json。CI Linux使用xvfb，干净安装还需批准 Electron 二进制安装脚本；真实PC人工视觉仍单独核对。不得用 Node 静态渲染或文件匹配代替该命令。

Node 测试与枚举阶段使用 `scripts/register-static-assets.mjs` 确认资源存在并提供静态导入对象形状；它不证明图片可渲染。真实生产导出和运行时检查仍负责 asset URL 与图片加载验收。

登录前端改版由login-runtime-smoke.cjs接入同一runtime:smoke，Web/Electron均实测五种登录、三种注册、字段错误、密码显隐/账号清空、协议勾选、未接入反馈、查询直达/刷新、资源加载、无认证请求。1920×1080读取卡片/字段/文字/按钮几何与mask合成属性；1280/1440/2560重排及真实1.25/1.5/2页面缩放、light主题读取计算样式。仅使用隔离测试profile和明确示例输入，通知alert在测试窗口内替身记录，正式代码不替换notification。结果dist/login-validation.json，截图dist/login-web-*、login-electron-*；H5/平板视觉及真机仍待用户验收。

首页进入流程新增隔离生产冒烟：未确认定位不启动后续、打卡X/遮罩/Escape不可关闭、单按钮焦点循环、同日去重、跨日、刷新恢复、俱乐部三关闭路径、否与关闭确认不永久隐藏、是持久化且不影响次日签到；读取三窗PC几何并捕获深浅主题，H5/平板待用户验收。

登录模拟的零账号请求检查使用独立未访问过业务页的窗口；仅排除明确属于其他窗口的请求，未知来源仍计入。避免把前序业务页残留加载误归为登录行为，不按路径白名单放行账号请求，保留零请求断言及整体严格资源检查。

登录冒烟区分同协议/同host的GET导出页面资源与账号请求，并记录pageRequests；englishlearning协议的URL.origin为null，不能与完整应用地址比较。login-request-kind.test覆盖HTTP/Electron及POST、API、外站和未导出路径，后四者不作为页面请求排除；零账号请求断言保持不变。

Next16.3.6静态导出的segment-cache/cache.js会先HEAD目标HTML验证路由，再取RSC片段；同协议/host且在CSP产物清单中的GET/HEAD页面资源计入pageRequests，API、POST、外站、未导出路径仍进入账号请求检查。Electron origin仍按protocol/host判断。

PK两个全屏状态页新增冒烟：大厅三个入口、邀请/机器人提示及关闭、取消对话框撤销/确认不删除房间、开启加载、无壳层、72%轨道/文案/ARIA一致、停留不进入练习、浏览器返回与静态直达/刷新。

路由冒烟先等待当前图片加载结束，再断言naturalWidth及资源状态；readyState=complete不代表水合后插入的图片已完成。等待不忽略失败图片，最终零尺寸与404仍阻断。
