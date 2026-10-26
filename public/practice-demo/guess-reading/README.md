# 猜词整词演示音频

`hand.wav`供`/practice/?demo=guess-basic&mode=guess`、阅读`mode=read`及打词`mode=spell`的hand目标词共用。通过本机macOS `say -v Samantha -r 160 -o <临时文件.aiff> 'hand.'`离线生成，再用`afconvert -f WAVE -d LEI16@22050 -c 1`转为单声道22050Hz／16bit PCM WAV，不经扬声器播放。

man、girl、boy、book、apple、water、sun、green、happy直接引用已有`/practice-demo/word-typing/`整词音源，不复制文件。页面按当前题目加载，切读与手动朗读共用`usePracticeReading`及现有提示音等待、媒体互斥和后台／卸载清理；无网络TTS、麦克风或后台评分请求。

全部为本地演示声音，正式题库由适配数据提供音源。按用户要求未运行页面实播或试听验收，听感、自动播放限制及各端兼容待用户验收。
