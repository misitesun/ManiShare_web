# Next 静态导出与 Electron 兼容性契约

- 适用范围：Next App Router output export、Client hydration、RSC预取与englishlearning协议。
- 已验证环境：2026-09-28 Node22.23.1、Next16.3.6/Turbopack、React19.2.8、Electron43.4.1。隔离PoC中 script-src self 阻断内联水合；逐HTML hash后事件、query恢复和Client导航成功，console error为零，document只初始加载一次。位图/SVG静态导入通过。
- 必须保留：每个HTML实际内联script生成CSP hash并与内容digest绑定；完整复制index.txt和__next.*.txt；RSC MIME为text/x-component，文件映射忽略query；未知资源严格404；Server序列化props与Client函数装配；useSearchParams局部Suspense。
- 禁止简化：只复制HTML、对任何未命中返回首页、script unsafe-inline/unsafe-eval、所有页面禁用SSR、混合公共barrel全局use client、以文件断言代替真实水合。
- 入口：electron/renderer-contract.ts、src/fsd/app/router、scripts/run-next.mjs、scripts/finalize-export.ts。主题/Storage bootstrap仍经各owner根入口。
- 自动化验证：pnpm run test、typecheck、双环境build、desktop:build、runtime:smoke（生产HTML/CSP/RSC/深链与事件）。
- 人工复测：PC1440×900比较页面布局/侧栏、查询视图、主题/持久化、弹窗与内部滚动；平板/H5视觉真机由用户验收。
- 替换条件：升级Next/Electron时必须在相同严格CSP及资源404契约下跑通真实生产运行时，确认新的RSC文件命名/MIME与导航没有整页回退后再更改方案。
