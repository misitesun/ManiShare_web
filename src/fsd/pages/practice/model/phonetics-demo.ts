import type { PracticeQuestion } from './practice-demo'
import type { PhoneticsLesson, PhoneticsWordSegment } from './phonetics-lesson'
import { getWordDemoReadingSource } from './word-demo-reading'

const audioRoot = '/practice-demo/phonetics-reading'

export const phoneticsDemoLesson: PhoneticsLesson = {
    id: 'front-vowel-ae',
    title: '前元音',
    targetPhonetic: 'æ',
    readingSource: `${audioRoot}/phonemes/ae.wav`,
    mnemonic: '张口低舌，短促有力',
    tips: [
        '口腔张开较大，舌前部低位，嘴角向两侧展开。',
        '下巴自然放低，声音保持短促有力。',
        '对比 cat /kæt/ 与 get /ɡet/，注意张口大小的区别。',
    ],
}

interface PhoneticsDemoWord {
    readonly word: string
    readonly translation: string
    readonly phonetic: string
    readonly sounds: readonly [string, string, string]
}

const words: readonly PhoneticsDemoWord[] = [
    { word: 'cat', translation: 'n. 猫', phonetic: '/kæt/', sounds: ['k', 'æ', 't'] },
    { word: 'bat', translation: 'n. 蝙蝠；球棒', phonetic: '/bæt/', sounds: ['b', 'æ', 't'] },
    { word: 'hat', translation: 'n. 帽子', phonetic: '/hæt/', sounds: ['h', 'æ', 't'] },
    { word: 'man', translation: 'n. 男人；成年男子', phonetic: '/mæn/', sounds: ['m', 'æ', 'n'] },
    { word: 'map', translation: 'n. 地图', phonetic: '/mæp/', sounds: ['m', 'æ', 'p'] },
    { word: 'cap', translation: 'n. 鸭舌帽；帽子', phonetic: '/kæp/', sounds: ['k', 'æ', 'p'] },
    { word: 'bag', translation: 'n. 袋子；包', phonetic: '/bæɡ/', sounds: ['b', 'æ', 'ɡ'] },
    { word: 'fan', translation: 'n. 扇子；风扇', phonetic: '/fæn/', sounds: ['f', 'æ', 'n'] },
    { word: 'ham', translation: 'n. 火腿', phonetic: '/hæm/', sounds: ['h', 'æ', 'm'] },
    { word: 'jam', translation: 'n. 果酱', phonetic: '/dʒæm/', sounds: ['dʒ', 'æ', 'm'] },
]

const phonemeFiles: Readonly<Record<string, string>> = {
    æ: 'ae',
    k: 'k',
    t: 't',
    b: 'b',
    h: 'h',
    m: 'm',
    n: 'n',
    p: 'p',
    ɡ: 'g',
    f: 'f',
    dʒ: 'j',
}

/** 一课十个不同词例；man、bag复用已有整词音源，其余使用本课的离线演示素材。 */
export const phoneticsDemoQuestions: readonly PracticeQuestion[] = words.map((item) => {
    const segments: readonly PhoneticsWordSegment[] = item.sounds.map((ipa, index) => {
        const file = phonemeFiles[ipa]
        return {
            id: `${item.word}:sound-${index + 1}`,
            spelling: item.word[index] ?? '',
            ipa,
            ...(file === undefined ? {} : { readingSource: `${audioRoot}/phonemes/${file}.wav` }),
        }
    })
    const group = {
        id: `${item.word}:phonics`,
        word: item.word,
        segments,
    }
    return {
        id: `phonetics:ae:${item.word}`,
        english: item.word,
        translation: item.translation,
        phonetic: item.phonetic,
        tokens: [],
        readingSource: getWordDemoReadingSource(item.word) ?? `${audioRoot}/words/${item.word}.wav`,
        wordPhonetics: { syllables: [group], phonics: [group] },
        phonetics: { lesson: phoneticsDemoLesson, segments },
    }
})
