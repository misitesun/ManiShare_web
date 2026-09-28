import phoneticsAsset from '../assets/phonetics.webp'
import dramaAsset from '../assets/drama.webp'
import grammarAsset from '../assets/grammar.webp'
import speakingAsset from '../assets/speaking.webp'
import adventureAsset from '../assets/adventure.webp'
import reviewAsset from '../assets/review.webp'
import dictationAsset from '../assets/dictation.webp'
import mistakesAsset from '../assets/mistakes.webp'

const phonetics: string = phoneticsAsset.src
const drama: string = dramaAsset.src
const grammar: string = grammarAsset.src
const speaking: string = speakingAsset.src
const adventure: string = adventureAsset.src
const review: string = reviewAsset.src
const dictation: string = dictationAsset.src
const mistakes: string = mistakesAsset.src

export interface AwakeningCourse {
    readonly id: string
    readonly title: string
    readonly image: string
    readonly author: string
    readonly heat: number
    readonly access: 'free' | 'vip' | 'lifetime'
}

const designCourses: readonly AwakeningCourse[] = [
    {
        id: 'phonetics',
        title: '发音基础练小学英语入门',
        image: phonetics,
        author: '周*周**',
        heat: 1000,
        access: 'free',
    },
    {
        id: 'drama',
        title: '边演边学小学英语绘本表演',
        image: drama,
        author: 'hey you~',
        heat: 2000,
        access: 'vip',
    },
    {
        id: 'grammar',
        title: '句型搭一搭小学英语语法入门',
        image: grammar,
        author: '小晴天',
        heat: 2309,
        access: 'lifetime',
    },
    {
        id: 'speaking',
        title: '勇敢说出来小学英语口语展示',
        image: speaking,
        author: '酸豆角的小毛牛',
        heat: 2098,
        access: 'free',
    },
    {
        id: 'adventure',
        title: '闯关拿奖章',
        image: adventure,
        author: '暖暖阳光min',
        heat: 1800,
        access: 'vip',
    },
    {
        id: 'review',
        title: '边演边学小学英语绘本表演',
        image: review,
        author: '慢两拍',
        heat: 2180,
        access: 'free',
    },
    {
        id: 'dictation',
        title: '句型搭一搭小学英语语法入门',
        image: dictation,
        author: 'rainbow',
        heat: 3201,
        access: 'free',
    },
    {
        id: 'mistakes',
        title: '勇敢说出来小学英语口语展示',
        image: mistakes,
        author: '百川',
        heat: 2468,
        access: 'lifetime',
    },
]

// 第二页仅用于静态分页演示，不代表额外真实课程。
export const awakeningCourses: readonly AwakeningCourse[] = [
    ...designCourses,
    ...designCourses.map((course) => ({ ...course, id: `${course.id}-continuation` })),
]
