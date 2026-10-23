import type { PracticeQuestion } from './practice-demo'
import { sentenceListeningQuestions } from './sentence-listening-demo'

export interface VideoListeningSegment {
    readonly id: string
    readonly start: number
    readonly end: number
    readonly question: PracticeQuestion
}

/** 十份已有PCM各加前后1秒静音后按题序连接；每段包含两端静音，时间单位秒。 */
const sentenceTimings = [
    [0.0, 3.163356009],
    [3.163356009, 5.980226757],
    [5.980226757, 8.930657596],
    [8.930657596, 11.855782313],
    [11.855782313, 14.933786848],
    [14.933786848, 17.997823129],
    [17.997823129, 20.882494331],
    [20.882494331, 23.798095238],
    [23.798095238, 26.847165533],
    [26.847165533, 29.836326531],
] as const

export const videoListeningSource = '/practice-demo/video-listening/dialogue.wav'

export const videoListeningSegments: readonly VideoListeningSegment[] = sentenceTimings.map(
    ([start, end], index): VideoListeningSegment => {
        const source = sentenceListeningQuestions[index]
        if (!source) throw new Error('视频演示句子与音轨时间段不一致')
        const id = `video:${source.id}`
        return {
            id,
            start,
            end,
            question: {
                id,
                english: source.english,
                translation: source.translation,
                phonetic: source.phonetic,
                tokens: source.tokens.map((token) => ({
                    ...token,
                    id: `video:${index}:${token.id}`,
                })),
            },
        }
    },
)

export const videoListeningQuestions: readonly PracticeQuestion[] = videoListeningSegments.map(
    (segment) => segment.question,
)
export const videoListeningDuration = videoListeningSegments.at(-1)?.end ?? 0
