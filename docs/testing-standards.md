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

`pnpm run test` 使用 Node 的 TypeScript runner 执行 `src/**/*.test.ts`，并执行静态资源迁移与源码契约校验器的脚本测试。当前没有 DOM 组件测试和 E2E；出现真实复杂交互或稳定关键流程后再独立接入，不机械搭建。

## 4. 写法

- 测试名称描述行为与条件。
- 正常、边界、失败路径放在同一概念文件中。
- 不依赖执行顺序，不共享可变全局状态。
- 外部时间、随机数、浏览器状态通过明确输入或能力边界隔离。
- 不用源码字符串扫描代替行为测试；架构/lint 规则可使用静态检查。

## 5. 提交前

```bash
pnpm run format:check
pnpm run test
pnpm run lint
pnpm run build
```

`pnpm run lint` 会再执行 `format:check`，单独列出是为了让格式偏差在完整 lint 前快速失败。涉及 Electron 时再执行 `pnpm run desktop:build`。浏览器与设备体验无法由当前测试覆盖时，在交接中列出实际复测视口与未复测项。Codex 的人工视觉验收只覆盖 PC（优先任务指定的桌面尺寸，未指定时为 1440×900）；平板与 H5 的视觉、横竖屏和真机兼容统一列为待用户验收，不得记为已通过。
