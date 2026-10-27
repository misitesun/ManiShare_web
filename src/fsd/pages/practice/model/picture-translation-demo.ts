import type { PracticeQuestion } from './practice-demo'
import { pictureListeningQuestions } from './picture-listening-demo'

/** 看图中译英与听力共用十条词例和音源，题目身份按模式隔离。 */
export const pictureTranslationQuestions: readonly PracticeQuestion[] =
    pictureListeningQuestions.map((question, index) => ({
        ...question,
        id: `picture-translation:${index + 1}`,
    }))
