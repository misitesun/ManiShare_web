# 句子沉浸听力默认朗读

本目录属于`pages/practice`的十条本地句子示例，仅用于本轮页面、自动切题、章节循环和自动下节验收，不是正式课程录音、用户录音或口语评分素材。

音频于2026-10-21使用本机已安装的macOS `say`、Samantha（en_US）、160词／分钟离线合成，文本逐条对应`model/sentence-listening-demo.ts`。以句首大写和句末句号朗读，不增加句子内容；通过系统`afconvert`保存为22,050Hz、16bit PCM、单声道WAV。不联网，不安装依赖，不使用技术纯音替代发音。

- `reading.wav`：We read books together.
- `listening-drink-water.wav`：You drink water.
- `listening-play-games.wav`：They play games.
- `listening-like-music.wav`：I like music.
- `listening-eat-apples.wav`：She eats apples.
- `listening-write-stories.wav`：He writes stories.
- `listening-learn-english.wav`：We learn English.
- `listening-watch-birds.wav`：They watch birds.
- `listening-speak-english.wav`：You speak English.
- `listening-share-ideas.wav`：We share ideas.

每条题目显式通过`readingSource`绑定同源`/practice-demo/sentence-listening/<id>.wav`，由现有朗读宿主播放。当前题需要播放时才创建Audio并加载自己的文件，不预加载全部十条，也不发起TTS或题库补字段请求；结束事件由真实媒体元素提供。

已生成并读取音频格式、时长与文件大小，未运行项目测试、构建、浏览器播放或各端验收。实际音质、浏览器自动播放权限、事件推进与Web／Electron／平板／H5效果由用户验收；正式课程接入时由数据适配器替换音源。

## 音频听力复用（2026-10-21）

用户确认音频与句子沉浸听力共用逻辑后，`getDemoQuestions('audio', 'listen')`复用同一十条本地样例及这些WAV固定URL。文件仍只保存一份；两个family的访问标识与会话独立，不共享进度、笔记或播放开关。没有新增合成、请求、依赖或课程音源，音频仍为离线生成的演示朗读，实际播放由用户验收。
