import type { PracticeFamily } from './practice-demo'

/** 同一组句子题型的两个内容来源；页面、输入和判题共用，数据／设置按来源隔离。 */
export type SentenceGameFamily = 'sentence' | 'audio'

export function isSentenceGameFamily(family: PracticeFamily): family is SentenceGameFamily {
    return family === 'sentence' || family === 'audio'
}

export function getSentenceGameLabel(family: SentenceGameFamily): string {
    return family === 'audio' ? '音频' : '句子'
}
