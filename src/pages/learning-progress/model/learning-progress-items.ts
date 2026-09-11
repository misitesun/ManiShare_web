import englishLearningMapSource from '../assets/english-learning-map.webp'
import oceanVocabularySource from '../assets/ocean-vocabulary.webp'
import pictureBookReadingSource from '../assets/picture-book-reading.webp'

export type LearningProgressCategory =
    'all' | 'awakening' | 'wisdom' | 'stories' | 'vocabulary' | 'bootcamp'

export type LearningProgressCourseCategory = Exclude<LearningProgressCategory, 'all'>

export interface LearningProgressItem {
    readonly category: LearningProgressCourseCategory
    readonly description: string
    readonly id: string
    readonly imageSource: string
    readonly practicedChapters: number
    readonly title: string
    readonly totalChapters: number
}

const designItems: readonly LearningProgressItem[] = [
    {
        category: 'awakening',
        description: '在场景记忆中记单词',
        id: 'ocean-vocabulary',
        imageSource: oceanVocabularySource,
        practicedChapters: 3,
        title: '海洋主题词汇',
        totalChapters: 15,
    },
    {
        category: 'awakening',
        description: '阶段目标清晰进阶',
        id: 'english-learning-map',
        imageSource: englishLearningMapSource,
        practicedChapters: 12,
        title: '英语学习地图',
        totalChapters: 20,
    },
    {
        category: 'awakening',
        description: '从图画到故事理解',
        id: 'picture-book-reading',
        imageSource: pictureBookReadingSource,
        practicedChapters: 8,
        title: '绘本阅读起步',
        totalChapters: 18,
    },
]

function createContinuationItem(item: LearningProgressItem): LearningProgressItem {
    return { ...item, id: `${item.id}-continuation` }
}

export const learningProgressPages: readonly (readonly LearningProgressItem[])[] = [
    designItems,
    designItems.map(createContinuationItem),
]

const emptyLearningProgressPages: readonly (readonly LearningProgressItem[])[] = [[]]

export function getLearningProgressPages(
    category: LearningProgressCategory,
): readonly (readonly LearningProgressItem[])[] {
    return category === 'all' || category === 'awakening'
        ? learningProgressPages
        : emptyLearningProgressPages
}
