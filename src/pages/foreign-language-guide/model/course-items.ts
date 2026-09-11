import englishMusicPartySource from '../assets/english-music-party.webp'
import farmVocabularySource from '../assets/farm-vocabulary.webp'
import magicEnglishAcademySource from '../assets/magic-english-academy.webp'
import winterSpeakingSource from '../assets/winter-speaking.webp'

export type ForeignLanguageCourseAccessTone = 'free' | 'gold' | 'lifetime' | 'paid'

export interface ForeignLanguageCourseItem {
    readonly accessLabel: string
    readonly accessTone: ForeignLanguageCourseAccessTone
    readonly id: string
    readonly imageSource: string
    readonly price: string
    readonly tags: readonly string[]
    readonly title: string
}

const designCourseItems: readonly ForeignLanguageCourseItem[] = [
    {
        accessLabel: 'VIP免费（A）',
        accessTone: 'gold',
        id: 'farm-vocabulary',
        imageSource: farmVocabularySource,
        price: '399.00',
        tags: ['标签', '标签'],
        title: '农场单词乐园',
    },
    {
        accessLabel: '终身VIP免费（B）',
        accessTone: 'lifetime',
        id: 'winter-speaking',
        imageSource: winterSpeakingSource,
        price: '400.00',
        tags: ['标签', '标签'],
        title: '冰雪口语训练营',
    },
    {
        accessLabel: '付费解锁（C）',
        accessTone: 'paid',
        id: 'english-music-party',
        imageSource: englishMusicPartySource,
        price: '330.00',
        tags: ['标签', '标签'],
        title: '英语音乐派对',
    },
    {
        accessLabel: '全员免费（D）',
        accessTone: 'free',
        id: 'magic-english-academy',
        imageSource: magicEnglishAcademySource,
        price: '0.00',
        tags: ['标签', '标签'],
        title: '魔法英语学院',
    },
]

function createContinuationCourseItem(
    courseItem: ForeignLanguageCourseItem,
): ForeignLanguageCourseItem {
    return { ...courseItem, id: `${courseItem.id}-continuation` }
}

export const foreignLanguageCoursePages: readonly (readonly ForeignLanguageCourseItem[])[] = [
    designCourseItems,
    designCourseItems.map(createContinuationCourseItem),
]
