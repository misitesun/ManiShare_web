# 看图学词沉浸听力示例朗读

本目录属于 `pages/practice` 的看图学词本地示例，由沉浸听力、中译英、指法练习和口语评测共用。按 Figma `2647:9783` 的十条播放列表使用五种词条，重复词条与不同模式保留独立题目 ID，但复用同一音频；各模式图片使用各自已确认的场景，不冒充正式课程或用户录音。

2026-10-26，沿用已有示例音频制作方式，以本机 macOS `say -v Samantha -r 160` 离线合成，再经 `afconvert -f WAVE -d LEI16@22050 -c 1` 转为 22050Hz、16bit、单声道 PCM WAV，无联网音频请求和新增依赖。

- `books.wav`：books.
- `tap.wav`：tap.
- `wash.wav`：wash.
- `dry.wav`：dry.
- `brush-teeth.wav`：brush teeth.

`picture-listening-demo.ts` 提供题库；既有 `usePracticeReading` 仅在当前访问具备播放意图时绑定同源音源，不预加载整个列表。首次进入／切题／列表选题朗读，切题提示音结束后再播放；失败或自动播放被拒绝时保留手动朗读入口。自动切题只在真实 ended 后等待 1000ms，不按文件时长推算。

仅核对文件元数据与引用，未进行实际试听、项目测试、构建或浏览器／Electron 验收。音质、权限及多端效果待用户验收。
