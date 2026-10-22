# 单词游戏补充示例朗读

本目录属于`pages/practice`，覆盖已有题库缺失的9个单词、30条解析例句与10条句中练义整句。原十词继续复用`../word-typing/`，不重复生成。这些是本地模拟题朗读，不是用户录音或正式课程素材。

2026-10-22使用本机已安装的macOS `say -v Samantha -r 160 -o <临时AIFF> <题目文本>`离线合成，再用`afconvert -f WAVE -d LEI16@22050 -c 1`转为22,050Hz、16bit、单声道PCM WAV。例句仅去除原数据的重点词标记，语境句按before＋目标词＋after合成，末尾句号用于停顿。无联网、依赖安装或参考站音频下载。

文件由`word-demo-reading.ts`、`word-card-analysis-demo.ts`和`word-meaning-demo.ts`引用。所有模式共用`usePracticeReading`及播放前置调度，只加载当前题／点击例句，不预加载整组。格式与非空帧已检查；未运行项目测试、构建或实际播放，音质、权限和多端效果待用户验收。

| 文件 | 朗读文本 |
| --- | --- |
| `words/school.wav` | school. |
| `words/flower.wav` | flower. |
| `words/butterfly.wav` | butterfly. |
| `words/bag.wav` | bag. |
| `words/dress.wav` | dress. |
| `words/path.wav` | path. |
| `words/park.wav` | park. |
| `words/grass.wav` | grass. |
| `words/walk.wav` | walk. |
| `examples/woman-1.wav` | The woman is my teacher. |
| `examples/woman-2.wav` | A woman is walking in the park. |
| `examples/woman-3.wav` | The young woman has a red bag. |
| `examples/man-1.wav` | The man is my father. |
| `examples/man-2.wav` | A man is reading a book. |
| `examples/man-3.wav` | The old man is very kind. |
| `examples/girl-1.wav` | The girl is my sister. |
| `examples/girl-2.wav` | A little girl is singing. |
| `examples/girl-3.wav` | The girl has long hair. |
| `examples/boy-1.wav` | The boy is my brother. |
| `examples/boy-2.wav` | A boy is playing football. |
| `examples/boy-3.wav` | The boy likes apples. |
| `examples/book-1.wav` | This is my favourite book. |
| `examples/book-2.wav` | Please open your book. |
| `examples/book-3.wav` | There is a book on the desk. |
| `examples/apple-1.wav` | I eat an apple every day. |
| `examples/apple-2.wav` | The apple is red. |
| `examples/apple-3.wav` | Would you like an apple? |
| `examples/water-1.wav` | Please give me some water. |
| `examples/water-2.wav` | The water is cold. |
| `examples/water-3.wav` | We need to drink more water. |
| `examples/sun-1.wav` | The sun is shining. |
| `examples/sun-2.wav` | The sun rises in the east. |
| `examples/sun-3.wav` | We can feel the warmth of the sun. |
| `examples/green-1.wav` | The grass is green. |
| `examples/green-2.wav` | I have a green pencil. |
| `examples/green-3.wav` | The leaves turn green in spring. |
| `examples/happy-1.wav` | I am very happy today. |
| `examples/happy-2.wav` | The children look happy. |
| `examples/happy-3.wav` | We are happy to see you. |
| `meaning/meaning-woman.wav` | The woman walks in the park. |
| `meaning/meaning-sun.wav` | The sun shines in the sky. |
| `meaning/meaning-flower.wav` | A flower grows beside the path. |
| `meaning/meaning-butterfly.wav` | A butterfly flies over the flowers. |
| `meaning/meaning-bag.wav` | The woman carries a bag. |
| `meaning/meaning-dress.wav` | She wears an orange dress. |
| `meaning/meaning-path.wav` | The path runs through the park. |
| `meaning/meaning-park.wav` | The park is full of flowers. |
| `meaning/meaning-grass.wav` | The grass is green. |
| `meaning/meaning-walk.wav` | She likes to walk in the park. |
