# 纯音标练习离线演示音频

供 `/practice/?demo=phonetics-basic&mode=pronounce` 的“前元音 /æ/”本地课程使用，全部为本机离线合成的演示音段，不是真人教师录音，也不是正式接口数据。固定同源 URL 供 Web、H5 和 Electron 静态资源映射读取；renderer 不调用系统语音服务、不需要网络 TTS 或新增依赖。

## 内容与来源

- 十个整词：cat、bat、hat、man、map、cap、bag、fan、ham、jam。
- `man` 复用 `/practice-demo/word-typing/man.wav`；`bag` 复用 `/practice-demo/word-reading/words/bag.wav`，不复制已有音源。
- 本目录 `words/` 包含其余八个词。沿已有方式使用 macOS `say -v Samantha -r 160 -o <临时文件.aiff> '<单词>.'` 生成，再用 `afconvert -f WAVE -d LEI16@22050 -c 1` 转换。
- `phonemes/` 包含11个独立发音：`ae`=/æ/、k、t、b、h、m、n、p、`g`=/ɡ/、f、`j`=/dʒ/。字母音使用显式 IPA 合成，不把字母名称或 IPA 字符的文字朗读当成自然拼读。

## 独立音素生成方式

开发阶段使用本机 AVFAudio 的 `AVSpeechSynthesizer.write` 输出文件，声音 ID 为 `com.apple.voice.compact.en-US.Samantha`，速率为 `AVSpeechUtteranceDefaultSpeechRate`。构造带 `AVSpeechSynthesisIPANotationAttribute` 的 `NSAttributedString`，属性值为单个发音的 IPA：æ、k、t、b、h、m、n、p、g、f、dʒ；例如将占位文本 `ham` 的整个范围覆盖为 `æ`，只合成 /æ/，占位文本不进入播放内容。

在当前本机声音中，`g` 音段使用引擎可识别的 ASCII `g` 作为 IPA 属性值；页面仍展示 /ɡ/。不使用 `[[inpt PHON]]` 作为普通文本输入来生成当前声音的独立音素。每段音频通过 buffer callback 写入临时 CAF，再转为单声道 22050Hz、16bit 小端 PCM WAV。生成过程只写文件，不经系统扬声器播放。

为避免较弱的辅音爆破被掩盖，仅对十个辅音音段做线性增益：原峰值低于12000时归一到12000，不衰减更响的音段、不压缩或截断波形；前后各补40／80ms数字静音，保留完整原始发音。/æ/与整词不做此增益。音素和整词的节奏由播放器在真实 `ended` 后额外等待350ms控制，不通过固定时间猜测音频是否播完。

## 使用边界

19个新增 WAV 由 `model/phonetics-demo.ts` 的显式音源表引用。只加载当前播放音段，不预加载整组数据；缺源、解码失败或自动播放被拒绝时显示提示，点击播放可重试。切题、后台、浮层、重置、设置切换和卸载取消旧队列，其他内容媒体开始时也会取消音素间隔中的队列。

本轮只检查生成文件的 PCM 格式、帧数和非零峰值，未进行页面实播、人工试听或语音质量验收。各独立音素的音色、清晰度、响度和自然拼读听感待用户试听；后续真实接口可按同一课程、词例、音素模型替换音源，不重新解析 IPA 或添加补字段请求。
