# 视频练习媒体资源

服务`pages/practice`视频演示，使用方为`VideoListeningExercise`、`VideoListeningControls`、`VideoExerciseCover`及各视频模式共用的`VideoPracticeLayout`（列表关闭图标）。听力设计来源为ManiShare的`546:40208`，自查／指法／口语／拼块沿用户补充截图及600×337尺寸；中译英按用户最新要求单独为900×500、下方中文和输入自然排布。同一封面在听力最大1100×618、中译英最大900×500、其余四模式最大600×337，小屏均随容器缩小，以object-cover保留图像比例，不复制或重导出资源。自查／拼块／中译英答案态隐藏封面但保留媒体宿主，指法及口语答案态保留；口语录制／评分期间播放入口禁用。

- `poster.png`：用户下载的`Rectangle 346244927.png`，1100×618封面，原始尺寸保留。
- `play.png`：用户下载的`Frame.png`，80×80透明播放图标；只用于封面居中的播放入口。
- `play.svg`／`pause.svg`：按用户补充接入下载目录的`Frame (1).svg`／`Frame.svg`，均为28×28，分别用于底栏播放／暂停。暂停文件与此前Figma `546:40231`导出内容一致，复用同一路径，不重复保存一份同图资源。
- `previous.svg`／`next.svg`：Figma `546:40228`／`546:40234`，28×28。
- `volume.svg`：`546:40238`，24×24。
- `repeat.svg`／`subtitles.svg`／`settings.svg`／`fullscreen.svg`：`546:40245`／`546:40251`／`546:40259`／`546:40264`，24×24。
- `close.svg`：`546:40304`，18×18。

SVG原文件的width、height、viewBox与路径不改。底栏单色图标经页内`VideoControlIcon`以CSS alpha遮罩配合`currentColor`着色，默认弱化前景，悬停／键盘聚焦使用主题前景色（深色主题白色、浅色主题深色），禁用项保留弱化且不响应悬停；关闭图标继续沿原主题滤镜。无需为悬停效果重导出其他SVG或修改原稿颜色，封面PNG保持原用途。封面不是动态视频；模拟单音轨位于`public/practice-demo/video-listening`，来源和句段时间见该目录README。实际视觉及播放按用户要求留待用户验收，本轮未运行测试或构建。
