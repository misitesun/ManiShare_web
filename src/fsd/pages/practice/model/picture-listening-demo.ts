import type { PracticeQuestion } from './practice-demo'
import type { PracticePlaybackListContent } from './practice-playback-list'

interface PictureListeningExample {
    readonly word: string
    readonly translation: string
    readonly phonetic: string
    readonly audio: string
}

const examples: readonly PictureListeningExample[] = [
    { word: 'books', translation: '书', phonetic: '/bʊks/', audio: 'books' },
    { word: 'tap', translation: '水龙头', phonetic: '/tæp/', audio: 'tap' },
    { word: 'wash', translation: '洗脸', phonetic: '/wɒʃ/', audio: 'wash' },
    { word: 'dry', translation: '干的', phonetic: '/draɪ/', audio: 'dry' },
    { word: 'brush teeth', translation: '刷牙', phonetic: '/brʌʃ tiːθ/', audio: 'brush-teeth' },
    { word: 'books', translation: '书', phonetic: '/bʊks/', audio: 'books' },
    { word: 'brush teeth', translation: '刷牙', phonetic: '/brʌʃ tiːθ/', audio: 'brush-teeth' },
    { word: 'dry', translation: '干的', phonetic: '/draɪ/', audio: 'dry' },
    { word: 'wash', translation: '洗脸', phonetic: '/wɒʃ/', audio: 'wash' },
    { word: 'books', translation: '书', phonetic: '/bʊks/', audio: 'books' },
]

/** 原稿十条播放列表；重复词条拥有独立题目身份，同词复用同一离线音源。 */
export const pictureListeningQuestions: readonly PracticeQuestion[] = examples.map(
    (item, index) => ({
        id: `picture-listening:${index + 1}:${item.audio}`,
        english: item.word,
        translation: item.translation,
        phonetic: item.phonetic,
        tokens: [],
        readingSource: `/practice-demo/picture-listening/${item.audio}.wav`,
    }),
)

export function getPictureListeningList(
    questions: readonly PracticeQuestion[],
    currentIndex: number,
): PracticePlaybackListContent {
    return {
        title: `播放列表（${questions.length === 0 ? 0 : currentIndex + 1}/${questions.length}）`,
        label: '看图学词播放列表',
        closeLabel: '关闭看图学词播放列表',
        entries: questions.map((question, index) => ({
            id: question.id,
            marker: String(index + 1).padStart(2, '0'),
            english: question.english,
            translation: question.translation,
        })),
    }
}
