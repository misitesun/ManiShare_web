import type { PracticeQuestion } from './practice-demo'
import { pictureListeningQuestions } from './picture-listening-demo'

/** 看图指法复用已有十条词例及音源，访问与计分身份按模式隔离。 */
export const pictureTypingQuestions: readonly PracticeQuestion[] = pictureListeningQuestions.map(
    (question, index) => ({
        ...question,
        id: `picture-typing:${index + 1}`,
    }),
)
