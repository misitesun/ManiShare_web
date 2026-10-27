import type { PracticeFamily } from './practice-demo'

/** 同一组句子题型的两个内容来源；页面、输入和判题共用，数据／设置按来源隔离。 */
export type SentenceGameFamily = 'sentence' | 'audio'

export function isSentenceGameFamily(family: PracticeFamily): family is SentenceGameFamily {
    return family === 'sentence' || family === 'audio'
}

export function getSentenceGameLabel(family: SentenceGameFamily | 'video' | 'picture'): string {
    if (family === 'video') return '视频'
    if (family === 'picture') return '看图学词'
    return family === 'audio' ? '音频' : '句子'
}
