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

完成双环境构建后运行 `pnpm run runtime:smoke`。脚本自动启动严格静态预览和 Electron hidden sandbox 窗口，加载实际 host/preload/protocol，分别遍历23条路由的代表实例，并验证水合、query、父级返回、壳层滚动与前进/返回、AI场景草稿/内部滚动及离开重置、主题持久化、IPC、未知页面和资源/API 404。结果写入被忽略的 dist/runtime-smoke.json。CI Linux使用xvfb，干净安装还需批准 Electron 二进制安装脚本；真实PC人工视觉仍单独核对。不得用 Node 静态渲染或文件匹配代替该命令。

Node 测试与枚举阶段使用 `scripts/register-static-assets.mjs` 确认资源存在并提供静态导入对象形状；它不证明图片可渲染。真实生产导出和运行时检查仍负责 asset URL 与图片加载验收。
