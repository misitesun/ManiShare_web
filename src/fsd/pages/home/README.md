# 学习首页

- 职责：`/` 的公告、千小时进度、六项统计、打卡留言、五位置活动占位轮播、竖版陪伴插画、月度花园和今日星光榜。
- 入口：根 `index.ts` 仅导出 HomePage；所有首页 UI、交互模型、模拟数据与素材仍属于 pages/home，不创建页面私有 widget/feature。
- 范围与约束：2026-10-14 用户确认 Figma `z7SIwUb9ep0j0ZaEwFrxJl / 1942:15239` 改版，包含统计页签、月份、轮播的本地交互及两处全局导航调整。无真实接口、学习累计、错题本跳转、打卡阈值、真实分享或新增持久化。分享按钮通过 TldDialog 明确提示海报未接入。保留首次定位提示及其原确认存储契约，不请求定位权限。
- 本地行为：统计默认总计，今天/昨天/本周/本月分别显示六项独立模拟值，未据示例定义学习统计公式。月份默认2026-08，支持前后月份与跨年、大小月/闰年，其他月份按实际天数截取同一演示日模板，不代表真实记录。每个日期经 TooltipGroup 展示示例学习时长，切换月份时访问名称同步。轮播默认第3位，前后循环及点选共5位；五页均是稿中灰色占位，无虚构活动图或自动轮播。以上状态刷新/重新进入恢复初始值。
- 云朵IP：HomeMascot 属于首页私有UI，复用 message-mascot.png，CommunityMessages 只提供70×70初始锚点。挂载后Portal到body，fixed浮层z55，高于页面/导航、低于TldDialog的z60；除云朵按钮外全部pointer-events-none。初始位于留言区右侧中部，滚动后固定在视口；首次拖动/键盘移动前随容器尺寸重新计算锚点，之后resize只限制在Safe Area及12px边距内。鼠标/触摸按住拖动，4px阈值区分轻点，Pointer Capture保证跨元素连续移动，结束/取消释放；位置只在本次页面内保存，刷新或离开后恢复。
- 云朵提示：鼠标悬停或键盘焦点显示轻微放大/上浮和两行居中文案“你好，我是Mani漫奇，”“在这里见证每一位小伙伴的成长之路！”，离开/失焦/拖动/Escape隐藏；触摸轻点切换提示，点外部关闭。提示优先上方，顶边不足时下移，左右避让；复用tooltip语义色，不改公共Tooltip。方向键每次移动10px，Enter/Space可切换提示；reduced-motion关闭形变与过渡。ResizeObserver及全局监听在卸载清理，移动更新只影响浮层子树。
- 星光榜：前三名按新稿为啷个哩个啷、艾琳、charles，更新头像、VIP、等级与时长布局；蓝紫/粉/橙榜台和三道原始光束，取消旧页面私有 WebGL LightRays。4～13名按稿示例，继续生成共50条独立内部滚动行；示例时长存在排序重复/矛盾，不据此实现真实排序规则。会员徽标继续共享 TldMembershipBadge。
- 响应式与特殊布局：首页保留既有用户确认的1720px最大宽度例外；与普通列表页250px版心不同。默认单列、lg紧凑桌面两列、≥1440px三列。1920×1080以749/415/484px为内容列、20/16px为局部沟槽，左16/右20px边距；上区738px、下区214px、行距16px与上下16px共1000px。视口更高时只由花园和榜单列表承接增量，不缩放整页；1440px流式收缩列宽。排行榜依自己的容器宽度缩放纯装饰榜台，头像与文字不统一缩放。统计在md三列、H5窄屏一/两列；花园小屏局部横滚，内容列纵向滚动，PC榜单列表独立滚动。
- 主题：消费现有语义 token；新增 home-star-* 与 media-foreground 在 dark/light 完整注册，插画上的文字保持媒体前景色，星光榜的时长颜色在 light 提高对比。原 home-podium-*-text 仍由PK使用，不改其色值或全局品牌渐变。
- 资源：assets/redesign 为 Figma 原始插画、3个头像、6个统计图标、3道光束、3个椭圆台面、轮播箭头、分享图标与留言吉祥物，共20项；图标使用导出原始宽高（光束164×134、台面128×40、统计40×40/41），PNG按各自目标槽位使用object-fit。不使用页面截图或临时URL。重复花盆、留言/排行头像继续复用已有资源；旧榜台/头像和旧统计图标没有消费者后移除。
- 公共影响图：pages/home → shared UI（进度、页签、会员标签、Tooltip、Dialog）；app/config/navigation → widgets/app-layout新增brand强调样式。我的推广奖励沿用/promotion/revenue/及已有语言key；漫奇联创天使仍沿用/collaboration/，非活动时显示渐变文字与原色图标，激活态继续依真实路径。新增颜色只在app/styles定义，不修改路由集合、环境、依赖、存储键或Electron bridge。
- 动画与兼容性：公告/留言继续通过shared/lib/animation循环并尊重reduced-motion，页面不运行WebGL光束；Portal和随机留言顺序仍在挂载后初始化，首次预渲染确定。遵守Next静态运行时CSP/RSC/资源404契约，Web与Electron共享renderer。
- 扩展：真实学习、打卡和排行榜接口接入前，先确认字段、统计口径、权限及状态转换；花盆模板的minutes/stage为独立示例，不推断真实成长规则。
- 验证：home-interactions.test覆盖五范围、日历边界/闰年/跨年和轮播循环，mascot-position.test覆盖四边/缩窗、提示避让、轻点与拖动阈值；原排行及定位测试保留。runtime:smoke检查云朵hover/focus/Escape、键盘移动与边界、滚动固定、resize、刷新复位和弹窗层级，保存dist/home-mascot-{web|electron}-{dark|light}-pc.png；真实鼠标拖动及视觉通过PC人工检查，触摸/平板/H5真机交由用户验收。执行format、test、lint、typecheck、双环境build、runtime:smoke；PC人工核对1920×1080/1440×900深浅主题、素材槽位、滚动、切换、分享提示和两处导航。

首页进入流程（2026-10-14确认）：HomeEntryFlow私有编排受控LocationPromptDialog、features/daily-checkin、俱乐部及不再提示确认，同一时刻一窗。定位仅确定后保存原布尔键并进入签到，不请求位置；原关闭行为保留，关闭不确认则此次不启动后续流程。上海自然日签到后立即展示俱乐部，出现时保存提示日期，刷新同日不重复；关闭俱乐部（X/遮罩/Escape）进入确认，是保存permanentlyClosed，否或关闭确认仅结束当天。永久关闭不影响每日签到或顶栏主动查看。未签到刷新仍保持打卡；签到已保存而俱乐部日期未保存时可恢复该步骤。其他统计/花园仍是原独立模拟。记录为本机示例，清除项目本地数据会恢复流程。保存异常明确反馈，不虚称已保存。
PC三窗563×212、470×322、470×195，标题20/28、正文16/22、操作14/20，二维码130px。共享TldDialog新增紧凑/内容适高变体，旧默认不变；二维码复用TldDemoQr，无真实接口、权限请求或新增路由。跨模块影响：home→daily-checkin/sharedDialog/sharedQR/time/storage；config登记dailyCheckin/homeClubPrompt，StorageSchema将payload保持unknown，owner校验；同步module-capabilities与runtime-smoke。home-entry.test验证流程、跨日、去重、关闭与永久关闭，生产Web/Electron验证刷新恢复、两主题几何、焦点和无资源错误，平板/H5视觉真机待用户验收。
