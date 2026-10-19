# 原版反馈动画资源

2026-10-19用户确认完整接入本机哇学社当前源码的7份答对动画与1份章节完成动画。本目录逐字节复制相关JSON；`source-manifest.json`记录原路径、字节数及SHA-256，原始文件不经Prettier重排。总计444738字节，均为自包含矢量，没有外部图片、字体或表达式；本次相关声纹本身由Canvas/SVG/DOM绘制，没有另需搬运的位图。

- `correct-0/1/2/4/5/6/7.json`来源`src/assets/lottie/success/0/1/2/4/5/6/7.json`，保留参考当前注册顺序，类型3在原设置中不存在，不补造。
- `chapter-complete.json`来源`src/assets/soloPractice/finish/practice-finish-fireworks.json`，240帧/60fps，原始4秒循环。
- 资源唯一运行入口为所属feature的`model/feedback-animations.ts`，每份按需动态导入；设置及练习经feature根入口共享，不复制到页面或public目录。来源根目录在manifest记录。
- 五种声纹的注册与视觉参考`src/hooks/recordingStyles.ts`及`src/views/setting/components/RecordingStylePicker.vue`；React实现归`ui/LearningAudioWave.tsx`，配色经全局语义token。
- 原5个emoji粒子选项不与7份Lottie强行等价。v1旧值统一兼容回退首份`lottie-0`，新选项逐项保存；其他偏好和存储键保持。

验证：同目录业务model测试核对8份资源的原始摘要、时长/速度及无外部资源；生产Web/Electron专项验证实际SVG/Canvas帧、设置往返、暂停/离页清理与reduced-motion。脚本存在不代表验收完成，实际结果记录在练习开发文档。
