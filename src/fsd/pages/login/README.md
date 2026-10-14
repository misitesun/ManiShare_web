# 登录与注册

- 职责：独立品牌介绍及五种登录、三种注册入口的前端界面与本地交互，不使用 App Shell；本阶段不提供真实认证服务。
- 入口：根 index.ts 导出 LoginPage、LoginView、parseLoginView 与 loginViewQuery，app/router/LoginPageRoute 在局部 Suspense 内读取查询并注入回调。页面私有 UI/model/assets 均留在本 slice，不预建认证 feature。
- 范围：2026-10-14 用户确认 Figma z7SIwUb9ep0j0ZaEwFrxJl 的 1947:15960、1981:16181、1966:16042、1984:16462、1984:16291、1984:16349；注册及验证码表单按哇学社已核实方式扩展，共用新卡片视觉。地球背景替代旧 Aurora；删除未使用源码、资源与 OGL 依赖。
- 约束：没有登录、注册、短信/邮件验证码、微信授权、找回密码或协议正文接口。提交通过本地基础校验后经 shared/notification 告知未接入，不发请求、不创建账号、不伪造成功/倒计时/扫码状态、不写入 token 或存储、不跳转登录后页面。微信图来自设计专用二维码，只展示遮罩下的模糊预览并标注暂不可授权。
- 交互：首屏两处登录按钮均打开默认微信视图；Logo 返回介绍页。五种登录为 phone-password、phone-code、email-password、email-code、wechat；注册为 register-phone、register-email、register-wechat。账号清空后回焦；密码默认隐藏，非空后出现显隐动作。模式切换丢弃表单草稿，不把账号、密码、验证码、邀请码或同意状态写入 URL/存储。注册字段为账号、验证码、密码和可选邀请码，须勾选协议；账号校验仅接受大陆 11 位手机号或基本邮箱格式，密码和验证码只校验必填，真实长度/复杂度/风控规则待后端契约。
- 路由：保持 /login/，只新增可恢复视图查询 view，默认/未知值为 welcome。切换通过 replace 且 scroll:false，保留其他查询值；返回介绍只删除 view。刷新/直达恢复对应视图，但不恢复敏感输入。Next 仍为静态导出，不新增动态路由、Server Action 或 API Route。
- 复用：TldInput appearance=glass、size=large；TldButton size=form 和 variant=outline。新增语义字体 field-label 为14/20、form-action 为16/22、form-title 为H5 20/28、md以上22/31。共享默认消费者不变，操作经原生表单/按钮，标签及错误关联、焦点、手型光标保持。
- 主题：login-* token 支持 dark/light。固定地球图片上的品牌介绍与 Logo 保留图片原色和浅色文字；表单卡片、字段、正文、分隔线、预览遮罩按主题变换，不在业务代码按主题分支。设计的书法字体没有授权字体资源，沿用全局微软雅黑→苹方→系统回退，不声称字形相同。

- 固定插画底色login-canvas在两主题保持黑色，图片加载期间也能读到品牌文案；首屏动作背景取login-canvas/10，不能借用light表单的浅色outline底色，否则浅色主题下白色动作文案失去对比。表单outline继续按主题变化。
- 基准：1920×1080 CSS视口、100%缩放。Logo x30/y30，200×63；介绍胶囊 y159，主标题60/72、字距0.1em，翼图279×157、y580，标语22/24、y760；卡片 x730/y235、460×610、圆角32，吉祥物100×100、y244，标题22/31/500、y348；输入框400×46、y412/476、间距18，操作文案14/20，登录与注册入口400×46、y573/637，替代方式图标42×42。二维码200×200、y414。介绍主操作仅中文“登录”，按当前中文开发契约移除稿中的附加英文；所有表单 Logo 保留作为返回介绍的可访问入口。注册、错误和协议提示允许自然增高。
- 响应式：H5两侧12px、卡片内20px，md以上卡片宽度上限460px、内29px；卡片垂直居中，内容过高自然滚动。介绍按角色缩小标题和间距，不缩放整个画布；背景 cover/bottom 可裁切。H5与平板保持同一DOM和本地行为，但视觉、横竖屏与真机待用户验收。
- 扩展：真实认证需求须提供端点、参数、返回、错误、验证码规则、微信授权/回调、协议正文与会话契约，再在独立动作 owner 建立 feature，经 shared/api 请求和 DTO 校验，不复用哇学社账号服务。
- 验证：login-view.test.ts 覆盖查询/无效值/方式对应，login-form.test.ts 覆盖账号、分模式字段和协议；共享组件渲染测试覆盖原生语义。运行 pnpm run format、test、lint、build 与 PC 基准计算样式/几何、所有视图交互、查询刷新、dark/light、无请求副作用、较窄/宽屏及缩放检查。证据与实际完成范围记录在 dist/login-validation.json 和 PC 截图，未完成项目必须另行标注。

LoginFormErrors的可选字段显式允许undefined，与validateLoginDraft当前返回的完整错误槽位匹配，保留原渲染与校验行为并满足exactOptionalPropertyTypes。
