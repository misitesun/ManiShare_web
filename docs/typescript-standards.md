# TypeScript 规范

项目使用 strict TypeScript。类型必须表达真实边界，而不是用断言掩盖不确定性。

## 1. 基础规则

- 禁止 `any`、非空断言、双重断言和无校验的外部数据断言。
- 所有具名函数、类方法、React 组件和公共 Hook 显式标注返回类型。
- 对象结构使用 `interface`；联合、交叉、映射、元组和泛型组合使用 `type`。
- 导入纯类型时使用 `import type`。
- 索引访问按 `noUncheckedIndexedAccess` 处理，不假设元素存在。
- 不用 `eslint-disable`、`oxlint-disable` 或 `@ts-ignore` 绕过规则。
- TypeScript 与 TSX 统一使用 4 个空格缩进，禁止 Tab；以根目录 `.editorconfig` 和 Prettier 结果为准，不手工维护与格式化器冲突的换行。

## 2. 类型归属

类型跟随拥有它的 FSD slice：

```text
entities/course/model/
features/submit-exercise/model/
widgets/app-layout/ui/
shared/api/
```

禁止 `src/types`、`shared/types` 或通用 `types.ts` 收纳无关概念。UI Props 与组件共置；公共类型经模块根 `index.ts` 导出。

## 3. 外部数据

浏览器存储、URL、API、IPC 和第三方库返回值都视为外部输入：

1. 输入保持 `unknown`；
2. 使用类型守卫或明确解析函数校验；
3. 转换为 DTO；
4. 再映射为领域模型或 UI 状态。

```ts
export interface CourseDto {
    id: string
    title: string
}

export function isCourseDto(value: unknown): value is CourseDto {
    if (typeof value !== 'object' || value === null) return false
    const candidate = value as Record<string, unknown>
    return typeof candidate.id === 'string' && typeof candidate.title === 'string'
}
```

窄范围 `Record<string, unknown>` 断言只能用于校验器内部，不能直接把外部数据断言为最终模型。

## 4. DTO、领域与 UI 分层

- DTO 表达服务端协议。
- 领域模型表达前端稳定业务含义。
- 表单状态允许未完成输入。
- UI Props 只包含渲染所需数据和回调。

不要用一个接口同时承担以上角色。命名应表达职责，如 `CourseDto`、`Course`、`SubmitExerciseRequest`、`CourseCardProps`，避免 `Data`、`Info`、`Type` 等泛称。

## 5. 数值与时间

普通布局和应用逻辑可直接使用 TypeScript 运算符，不再为量化精确运算建立全局限制。

学习进度、积分、计费、连续学习天数或复习调度等领域数据一旦出现，所属 `entities`/`features` 必须定义：

- 单位与有效范围；
- 精度和舍入；
- 缺失、非法与除零语义；
- 相邻单元测试。

日期时间的原生 `Date` 与 `Intl.DateTimeFormat` 只在 `shared/lib/time` 实现。API 中表示确定时刻的字符串必须包含时区。

## 6. React

- Props 使用只读语义；回调签名写明参数和返回值。
- State 只保存无法从 props/state 推导的最小值。
- 不在 Effect 中同步可直接推导的状态。
- 列表 key 使用稳定领域 ID，不使用数组索引。
- 懒加载边界放在路由或明确的大型能力，不为小组件机械拆包。
- 浏览器事件、计时器和订阅在 Effect 中成对清理。

## 7. AI 检查清单

1. 类型是否属于正确 slice？
2. 外部输入是否仍是 `unknown` 并经过校验？
3. DTO、领域模型与 UI Props 是否分层？
4. 具名函数和组件是否有返回类型？
5. 是否新增 `any`、非空断言或宽泛断言？
6. 领域数值和时间语义是否明确？
7. 是否补充了必要测试，并按[验证分级](testing-standards.md#0-开发期间按影响验证2026-10-19)执行了本轮定向检查或交付门禁？
8. 是否已运行 Prettier，且没有 Tab 或非 4 空格缩进？

## Next 与 FSD 运行时契约

- Next 16.3.6 / Turbopack 是唯一框架入口，`output: 'export'`、`trailingSlash: true`；不运行 Next Server，不使用 API Route、Server Action、cookies/headers 或按请求渲染。
- 六层业务位于 `src/fsd`；`src/app` 只放 Next 路由、layout、Metadata 和错误边界。FSD 不反向导入适配层。
- Server page 只 await params 并传序列化 ID/字符串。路径构造回调在 `src/fsd/app/router` Client 装配。跨 slice 使用根 index；混合公共入口不加 use client；枚举器不得依赖浏览器。
- Client Component 仍参与预渲染；首次渲染禁止读取浏览器存储/视口或使用随机值。偏好、Portal 和动画在挂载后恢复。`useSearchParams` 放在最近的 Suspense 边界下，视图 replace 保留其他查询参数并使用 scroll:false。
- 图片导入在 owner 内转换为 `.src`，保持 UI/model 的 string URL 契约。主题首次绘制脚本由 shared/theme 与 shared/lib/storage 生成；仅 html 的主题属性允许窄范围 hydration warning 抑制。
- 根 tsconfig 保持 strict 与 Next 类型生成；Electron 用独立 tsconfig。新路由同步枚举测试、静态产物集合和部署文档。
- 类型、文件断言与真实水合/导航验收分开记录。Tablet/H5 视觉和真机仍待用户验收。
