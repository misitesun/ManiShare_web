import type { PracticeQuestion } from './practice-demo'
import classroomAsset from '../assets/picture-reader.png'
import readingAsset from '../assets/reading-scene.png'
import greetingAsset from '../assets/guess/scene.png'
import womanAsset from '../assets/word-woman-e23d5f.png'
import posterAsset from '../assets/video-listening/poster.png'

interface PictureReaderSlide {
    readonly id: string
    readonly title: string
    readonly source: string
}

/** 首图对应原稿，其余复用已有本地素材，仅供轮播验收。 */
export const pictureReaderSlides: readonly PictureReaderSlide[] = [
    { id: 'picture-classroom', title: '教室场景', source: classroomAsset.src },
    { id: 'picture-reading', title: '阅读场景', source: readingAsset.src },
    { id: 'picture-greeting', title: '打招呼场景', source: greetingAsset.src },
    { id: 'picture-woman', title: '人物插画', source: womanAsset.src },
    { id: 'picture-books', title: '一起读书', source: posterAsset.src },
]

// 与轮播共用唯一列表和身份，不构造英文题干、音源或作答目标。
export const pictureReaderQuestions: readonly PracticeQuestion[] = pictureReaderSlides.map(
    (slide) => ({ id: slide.id, english: '', translation: '', phonetic: '', tokens: [] }),
)
