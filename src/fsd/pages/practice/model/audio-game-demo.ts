import type { PracticeQuestion } from './practice-demo'
import { sentenceListeningQuestions } from './sentence-listening-demo'

/** 音频独立十题：只继承示例正文和只读WAV资源，不复用句子题目／词块对象与ID。 */
export const audioGameQuestions: readonly PracticeQuestion[] = sentenceListeningQuestions.map(
    (question) => ({
        ...question,
        id: `audio:${question.id}`,
        tokens: question.tokens.map((token) => ({
            ...token,
            id: `audio:${question.id}:${token.id}`,
        })),
    }),
)
