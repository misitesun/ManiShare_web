import type { PracticeQuestion } from './practice-demo'
import { getDemoWordPhonetics } from './word-phonetics-demo'
import { getWordDemoReadingSource } from './word-demo-reading'
import { getDemoWordCardExamples } from './word-card-analysis-demo'
import scene from '../assets/guess/scene.png'
import hand from '../assets/guess/hand.png'
import wordImage from '../assets/word-woman-e23d5f.png'

interface GuessWordFixture {
    readonly word: string
    readonly phonetic: string
    readonly translation: string
    readonly before: string
    readonly after: string
}

const fixtures: readonly GuessWordFixture[] = [
    {
        word: 'hand',
        phonetic: '/hænd/',
        translation: 'n.手；人手；员工；笔迹 v.传递',
        before: '他有一双肥嘟嘟的',
        after: '',
    },
    {
        word: 'man',
        phonetic: '/mæn/',
        translation: 'n.男人；成年男子',
        before: '门口站着一位高大的',
        after: '',
    },
    {
        word: 'girl',
        phonetic: '/ɡɜːl/',
        translation: 'n.女孩；姑娘',
        before: '背着书包的是一个可爱的',
        after: '',
    },
    {
        word: 'boy',
        phonetic: '/bɔɪ/',
        translation: 'n.男孩；少年',
        before: '正在向朋友挥手的是那个',
        after: '',
    },
    {
        word: 'book',
        phonetic: '/bʊk/',
        translation: 'n.书；书本',
        before: '她的书包里装着一本',
        after: '',
    },
    {
        word: 'apple',
        phonetic: '/ˈæpəl/',
        translation: 'n.苹果',
        before: '桌子上放着一个红红的',
        after: '',
    },
    {
        word: 'water',
        phonetic: '/ˈwɔːtə(r)/',
        translation: 'n.水',
        before: '运动以后，我想喝一杯',
        after: '',
    },
    {
        word: 'sun',
        phonetic: '/sʌn/',
        translation: 'n.太阳；阳光',
        before: '早晨，天空中升起了温暖的',
        after: '',
    },
    {
        word: 'green',
        phonetic: '/ɡriːn/',
        translation: 'adj.绿色的',
        before: '小男孩背着一个',
        after: '的书包',
    },
    {
        word: 'happy',
        phonetic: '/ˈhæpi/',
        translation: 'adj.快乐的；高兴的',
        before: '见到好朋友，她感到很',
        after: '',
    },
]

/** 猜词、阅读与打词共用十条语境和目标词，图片为共用演示素材。 */
export const guessWordQuestions: readonly PracticeQuestion[] = fixtures.map((fixture) => {
    const wordPhonetics = getDemoWordPhonetics(fixture.word, fixture.phonetic)
    const readingSource =
        fixture.word === 'hand'
            ? '/practice-demo/guess-reading/hand.wav'
            : getWordDemoReadingSource(fixture.word)
    return {
        id: `guess:${fixture.word}`,
        english: fixture.word,
        phonetic: fixture.phonetic,
        translation: fixture.translation,
        tokens: [],
        ...(wordPhonetics ? { wordPhonetics } : {}),
        wordExamples: getDemoWordCardExamples(fixture.word),
        ...(readingSource ? { readingSource } : {}),
        guess: {
            before: fixture.before,
            after: fixture.after,
            scene: scene.src,
            image: fixture.word === 'hand' ? hand.src : wordImage.src,
        },
    }
})
