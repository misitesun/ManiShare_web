# Client 路由装配

- 练习退出通过`PracticePageRoute`注入`onExit`，`resolvePracticeExitPath`分别返回既有首页或来源课程路径；来源继续经`resolvePracticeBackPath`白名单校验，缺失/非法时回`/awakening/`。页面在退场完成后发出目的地意图，app负责Client push。不新增URL参数、路由集合或后台请求。

- 职责：每个路由单独装配页面、路径回调与局部 Suspense；共享 App Shell 与 Provider。
- 入口：各 PageRoute、AppShell、AppProviders；由 Next page/layout 导入。
- 约束：不再维护独立 router；不把函数从 Server 传到 Client。登录、两个PK状态页及练习演示页使用独立布局，其余25个路由复用壳层；SettingsPageRoute 使用局部 Suspense，AppShell 注入 settingsPath。PkArenaPageRoute 装配 `/pk/` 首页，侧栏 PK 入口接通 routePaths.pkArena。CompetitionPageRoute 装配 `/competition/` 静态未开放页，侧栏风采大赛入口接通 routePaths.competition。未知页面静态 404 文档保持原默认回首页行为，缺失资源没有 HTML 回退。
- 扩展：新增动态路由时使用 owner 根入口的纯参数枚举器，不复制 ID 列表。
- 验证：检查业务 HTML、全部 RSC 与真实 Client 导航；本轮构建、运行时与PC验收结果及剩余限制见[练习页开发文档第17.4节](../../../../docs/practice-page-development.md#174-验证记录)，不以目标计数代替实际结果。

- 登录视图：LoginPageRoute的局部Suspense包围查询读取；app装配 view 与 onViewChange，解析和查询转换经 pages/login 根公共入口。/login/?view= 表达介绍、五种登录、三种注册；replace保留其他查询值、scroll:false，不向Server传函数，不新增静态页面集合，不把敏感输入写入URL。

- PK状态：PkMatchingPageRoute装配取消返回大厅/开始加载；新增(pk-session)路由分组保持全屏，无AppShell，不变更根AppProviders或Electron桥。

- 完整设置：`AppProviders` 在 `ThemeProvider` 内单次装配 `features/learning-settings` 的 `LearningSettingsProvider`，独立页、练习设置弹窗、预览和练习共享偏好与背景图；`SettingsPageRoute` 继续提供局部 Suspense。app 只装配公共能力，不实现设置校验、复制表单或让 page 横向依赖。
- 练习演示：`PracticePageRoute`在局部Suspense内适配`/practice/?demo=&mode=`，查询解析由`pages/practice`根入口提供。它们只代表本地演示视图，非法组合提示重新选择；切换保留其他query及`scroll:false`。`AwakeningCoursePageRoute`给课程详情注入`onStartPractice(demoId,mode)`：句子/单词/音频/视频/猜词/看图学词先由共享feature选择模式，独立指法/音标和四种纯内容直接进入对应演示。13张本地卡均可体验，VIP标记仅展示，顶部“开始学习”仍进入演示目录，不伪造后台权限或题库。
- `practice-origin.ts`的`buildPracticePath`先验证课程owner枚举的`courseId`，再经`pages/practice`根`resolvePracticeView`验证`demoId/mode`；非法组合拒绝生成。三参调用保持`demo/mode/sourceCourse`；第4参`sourceChapter`经`pages/awakening`根`isAwakeningPracticeSource`验证章节/演示匹配后才加入query，仅为本地演示来源，不是后台章节ID。`resolvePracticeDraftScope`合法返回`course:chapter`，缺失/非法/不匹配回退`demo:<id>`，避免同族第1/4章串稿。切小模式保留来源，回目录删除`sourceChapter`且保留`sourceCourse`供返回。`resolvePracticeBackPath`只接受课程白名单，不接任意returnUrl。无新增路由、存储键、接口或IPC，当前仍29项路由契约。

- 媒体验证：练习通过页面 owner 的固定源声明注入自制 WAV/MP4（`public/practice-demo`），界面明确为非课程技术片段；app 不请求课程音源或提供媒体服务。严格预览/Electron 共用的静态解析器新增对应 MIME，不修改根 Provider 以外的宿主桥、CSP或业务接口。
