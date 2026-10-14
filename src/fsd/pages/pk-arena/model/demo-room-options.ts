import type { RoomChapterOption, RoomCourseOption } from '../../../features/pk-create-room'
import phrasesAsset from '../assets/create-course-phrases.png'
import vocabularyAsset from '../assets/create-course-vocabulary.png'
import listeningAsset from '../assets/create-course-listening.png'
import phoneticsAsset from '../assets/create-course-phonetics.png'
import sentenceAsset from '../assets/create-chapter-sentence.svg'
import wordAsset from '../assets/create-chapter-word.svg'
import audioAsset from '../assets/create-chapter-audio.svg'
import sentenceIconAsset from '../assets/create-chapter-sentence-icon.svg'
import wordIconAsset from '../assets/create-chapter-word-icon.svg'
import audioIconAsset from '../assets/create-chapter-audio-icon.svg'

const chapterCorners = [sentenceAsset.src, wordAsset.src, audioAsset.src]
const chapterIcons = [sentenceIconAsset.src, wordIconAsset.src, audioIconAsset.src]

function demoChapters(courseId: string): readonly RoomChapterOption[] {
    return (['sentence', 'word'] as const).flatMap((game) =>
        Array.from({ length: 6 }, (_, index): RoomChapterOption => ({
            id: `${courseId}-${game}-${index + 1}`,
            game,
            title:
                game === 'sentence'
                    ? 'College Chinese Should Be a Compulsory Course.'
                    : `Topic ${index + 1} - Classroom Words`,
            translation: game === 'sentence' ? '大学语文应该为必修课' : '课堂常用词汇',
            access: index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'lifetime' : 'free',
            cornerSource: chapterCorners[index % 3] ?? sentenceAsset.src,
            iconSource: chapterIcons[index % 3] ?? sentenceIconAsset.src,
        })),
    )
}

const coverSources = [phrasesAsset.src, vocabularyAsset.src, listeningAsset.src, phoneticsAsset.src]

export const demoRoomCourses: readonly RoomCourseOption[] = Array.from(
    { length: 8 },
    (_, index): RoomCourseOption => {
        const id = `pk-demo-course-${index + 1}`
        return {
            id,
            title:
                index < 4
                    ? '520句轻松搞定三年级下册英语词组（新课标人教版PEP）'
                    : `英语生活常用表达式 · 示例课程${index + 1}`,
            imageSource: coverSources[index % 4] ?? phrasesAsset.src,
            access: index % 4 === 0 ? 'free' : index % 4 === 2 ? 'lifetime' : 'gold',
            chapters: demoChapters(id),
        }
    },
)
