# 下拉浮层触发

公共入口为`usePopoverTrigger`；`createPopoverTrigger`提供无DOM的交互状态与取消模型。

- PC／Electron的xl桌面布局（CSS视口≥1280px），且同时满足`hover:hover`、`pointer:fine`时，鼠标悬停展开；其余视口和触控指针点击展开。不用UA判断设备。
- Hover展开不抢输入焦点；鼠标离开触发区和菜单后延迟150ms关闭，进入任一区域取消关闭，跨越Portal间隙不闪退。焦点还在浮层或触发器内时保留键盘操作。
- 点击、Enter／Space仍可切换；方向键打开使用`openByKeyboard`并由组件管理选项焦点。调用方仅在`shouldFocusOnOpen`返回true时执行打开聚焦。
- Root及Portal菜单同时绑定返回的指针进入／离开事件，受控open仍只有调用方一个来源。所有取消回调带版本门控，关闭、卸载和媒体条件变化均清理计时器／监听。
- 本模块不拥有外点、Esc、选中关闭、选项导航或业务设置归焦；这些由UI所有者保持语义。练习选项浮层允许输入归焦后保持打开，单选菜单选中后仍关闭。

真实消费者：`shared/ui/tld-select`、`pages/practice/ui/PracticeToolbarControls`。不修改路由、存储、依赖或Electron桥。

影响图：`TldSelect`现有运行消费者为学习设置的`SettingControls`、练习`WordPracticeToolbar`和查漏补缺`KnowledgeGapsPage`，保留现有value、onValueChange、受控open、Portal及菜单语义，统一新增触发方式；其他仅引用`TldSelectOption`类型的页面不因此改变运行行为。本次未逐页运行验收。练习共享选项浮层另覆盖单词、句子、音频及其他练习族。其余自绘同类控件在后续新增或修改时须按开发规范复用此入口，不新增独立设备判断。

同目录模型测试覆盖鼠标／触控、点击／键盘、延迟跨区与取消；本次仅编写，未运行。PC实际悬停、Portal、键盘与浏览器缩放，平板／H5的触摸和系统软键盘均待验收。
