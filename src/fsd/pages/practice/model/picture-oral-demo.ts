import type { PracticeQuestion } from './practice-demo'
import { pictureListeningQuestions } from './picture-listening-demo'

/** 看图口语沿已有十条词例和音源，评测访问身份与其他模式隔离。 */
export const pictureOralQuestions: readonly PracticeQuestion[] = pictureListeningQuestions.map(
    (question, index) => ({
        ...question,
        id: `picture-oral:${index + 1}`,
    }),
)
