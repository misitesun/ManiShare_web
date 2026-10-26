import { judgeWordSpelling } from './word-spelling'
import type { WordSpellingStatistics } from './word-spelling'
import { getDemoWordPhonetics } from './word-phonetics-demo'
import type { WordPhoneticBreakdown } from './word-phonetics'
import type { GuessWordContent } from './guess-word'
import { guessWordQuestions } from './guess-word-demo'
import { getDemoWordCardExamples } from './word-card-analysis-demo'
import type { WordCardExample } from './word-card-analysis'
import type { WordMeaningContent } from './word-meaning'
import { wordMeaningQuestions } from './word-meaning-demo'
import { sentenceListeningQuestions } from './sentence-listening-demo'
import { audioGameQuestions } from './audio-game-demo'
import { videoListeningQuestions } from './video-listening-demo'
import { typingGameQuestions } from './typing-game-demo'
import { phoneticsDemoQuestions } from './phonetics-demo'
import { pictureReaderQuestions } from './picture-reader-demo'
import type { PhoneticsWordContent } from './phonetics-lesson'
import { editSentenceBlocks, judgeSentenceBlocks } from './sentence-blocks'
import type { SentenceBlockEdit } from './sentence-blocks'
import { getWordDemoReadingSource } from './word-demo-reading'
import {
    createSentenceAnswerLayout,
    isSentenceAnswerComplete,
    judgeSentenceAnswerValues,
    serializeSentenceAnswer,
} from './sentence-answer-input'

export type PracticeFamily =
    | 'word'
    | 'sentence'
    | 'audio'
    | 'video'
    | 'picture'
    | 'typing'
    | 'phonetics'
    | 'guess'
    | 'audio-reader'
    | 'video-reader'
    | 'picture-reader'
    | 'text-reader'
export type PracticeMode =
    | 'pronounce'
    | 'spell'
    | 'dictate'
    | 'meaning'
    | 'typing'
    | 'oral'
    | 'listen'
    | 'read'
    | 'check'
    | 'translate'
    | 'blocks'
    | 'guess'
export type PracticePhase = 'answering' | 'revealed' | 'correct' | 'incorrect'
export interface PracticeDemo {
    readonly id: string
    readonly title: string
    readonly family: PracticeFamily
    readonly modes: readonly PracticeMode[]
    readonly node: string
}
export interface PracticeToken {
    readonly id: string
    readonly text: string
    readonly phonetic: string
    readonly meaning: string
    readonly pos: 'pronoun' | 'verb' | 'noun' | 'adverb'
    readonly syntax: 'subject' | 'predicate' | 'object' | 'complement' | 'adverbial' | 'unknown'
}
export interface PracticeQuestion {
    readonly id: string
    readonly english: string
    readonly translation: string
    readonly phonetic: string
    readonly wordPhonetics?: WordPhoneticBreakdown
    readonly phonetics?: PhoneticsWordContent
    /** 可选的本地解析例句，真实接口由适配器映射；缺失时显示空态。 */
    readonly wordExamples?: readonly WordCardExample[]
    readonly wordMeaning?: WordMeaningContent
    readonly guess?: GuessWordContent
    readonly tokens: readonly PracticeToken[]
    /** 页面内部的可选朗读音源，后续由真实接口适配器映射；不是后台字段约定。 */
    readonly readingSource?: string
}
export const modeLabels: Record<PracticeMode, string> = {
    pronounce: '单词拼读',
    spell: '单词拼写',
    dictate: '单词默写',
    meaning: '句中练义',
    typing: '指法练习',
    oral: '口语评测',
    listen: '沉浸听力',
    read: '阅读全览',
    check: '理解自查',
    translate: '中译英',
    blocks: '选词拼块',
    guess: '猜词模式',
}
export function getPracticeModeLabel(family: PracticeFamily, mode: PracticeMode): string {
    if (family === 'phonetics' && mode === 'pronounce') return '音标练习'
    if (family === 'guess' && mode === 'read') return '阅读模式'
    if (family === 'guess' && mode === 'spell') return '打词模式'
    return modeLabels[mode]
}
const sentenceModes: readonly PracticeMode[] = [
    'listen',
    'read',
    'check',
    'translate',
    'blocks',
    'typing',
    'oral',
]
export const practiceDemos: readonly PracticeDemo[] = [
    {
        id: 'word-basic',
        title: '单词游戏',
        family: 'word',
        modes: ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral'],
        node: '546:31237',
    },
    {
        id: 'sentence-basic',
        title: '句子游戏',
        family: 'sentence',
        modes: sentenceModes,
        node: '546:33602',
    },
    {
        id: 'audio-basic',
        title: '音频游戏',
        family: 'audio',
        modes: sentenceModes,
        node: '546:36653',
    },
    {
        id: 'video-basic',
        title: '视频游戏',
        family: 'video',
        modes: ['listen', 'check', 'translate', 'blocks', 'typing', 'oral'],
        node: '546:40208',
    },
    {
        id: 'picture-basic',
        title: '看图学词',
        family: 'picture',
        modes: ['listen', 'translate', 'typing', 'oral'],
        node: '2647:9783',
    },
    {
        id: 'typing-basic',
        title: '独立指法',
        family: 'typing',
        modes: ['typing'],
        node: '546:41770',
    },
    {
        id: 'phonetics-basic',
        title: '音标游戏',
        family: 'phonetics',
        modes: ['pronounce', 'oral'],
        node: '546:41805',
    },
    {
        id: 'guess-basic',
        title: '猜词游戏',
        family: 'guess',
        modes: ['guess', 'read', 'spell'],
        node: '546:42057',
    },
    {
        id: 'audio-reader',
        title: '纯音频阅读器',
        family: 'audio-reader',
        modes: ['read'],
        node: '546:43531',
    },
    {
        id: 'video-reader',
        title: '纯视频阅读器',
        family: 'video-reader',
        modes: ['read'],
        node: '546:43497',
    },
    {
        id: 'picture-reader',
        title: '纯图片阅读器',
        family: 'picture-reader',
        modes: ['read'],
        node: '546:43565',
    },
    {
        id: 'text-reader',
        title: '纯文字阅读器',
        family: 'text-reader',
        modes: ['read'],
        node: '546:43593',
    },
]
const readingTokens: readonly PracticeToken[] = [
    { id: 'we', text: 'we', phonetic: '/wiː/', meaning: '我们', pos: 'pronoun', syntax: 'subject' },
    {
        id: 'read',
        text: 'read',
        phonetic: '/riːd/',
        meaning: '读',
        pos: 'verb',
        syntax: 'predicate',
    },
    {
        id: 'books',
        text: 'books',
        phonetic: '/bʊks/',
        meaning: '书',
        pos: 'noun',
        syntax: 'object',
    },
    {
        id: 'together',
        text: 'together',
        phonetic: '/təˈɡeðə(r)/',
        meaning: '一起',
        pos: 'adverb',
        syntax: 'unknown',
    },
]
function withDemoWordPhonetics(question: PracticeQuestion): PracticeQuestion {
    if (question.wordPhonetics) return question
    const wordPhonetics = getDemoWordPhonetics(question.english, question.phonetic)
    return wordPhonetics ? { ...question, wordPhonetics } : question
}

const wordPronunciationQuestions: readonly PracticeQuestion[] = [
    {
        id: 'woman',
        english: 'woman',
        translation: 'n.妇女；女性；成年女子',
        phonetic: '/ˈwʊmən/',
        tokens: [],
    },
    {
        id: 'man',
        english: 'man',
        translation: 'n.男人；成年男子',
        phonetic: '/mæn/',
        tokens: [],
    },
    {
        id: 'girl',
        english: 'girl',
        translation: 'n.女孩；姑娘',
        phonetic: '/ɡɜːl/',
        tokens: [],
    },
    {
        id: 'boy',
        english: 'boy',
        translation: 'n.男孩；少年',
        phonetic: '/bɔɪ/',
        tokens: [],
    },
    {
        id: 'book',
        english: 'book',
        translation: 'n.书；书本',
        phonetic: '/bʊk/',
        tokens: [],
    },
    {
        id: 'apple',
        english: 'apple',
        translation: 'n.苹果',
        phonetic: '/ˈæpəl/',
        tokens: [],
    },
    {
        id: 'water',
        english: 'water',
        translation: 'n.水',
        phonetic: '/ˈwɔːtə(r)/',
        tokens: [],
    },
    {
        id: 'sun',
        english: 'sun',
        translation: 'n.太阳；阳光',
        phonetic: '/sʌn/',
        tokens: [],
    },
    {
        id: 'green',
        english: 'green',
        translation: 'adj.绿色的',
        phonetic: '/ɡriːn/',
        tokens: [],
    },
    {
        id: 'happy',
        english: 'happy',
        translation: 'adj.快乐的；高兴的',
        phonetic: '/ˈhæpi/',
        tokens: [],
    },
].map((question) =>
    withDemoWordReading(
        withDemoWordPhonetics({
            ...question,
            wordExamples: getDemoWordCardExamples(question.english),
        }),
    ),
)

/** 指法练习复用已核实词条内容，保持独立题目身份与十题题量。 */
const wordTypingQuestions: readonly PracticeQuestion[] = wordPronunciationQuestions.map(
    (question) =>
        withDemoWordReading({
            ...question,
            id: `typing:${question.id}`,
        }),
)

/** 口语独立十题身份；复用相同单词音源，录音与评分仍为本地模拟。 */
const wordOralQuestions: readonly PracticeQuestion[] = wordPronunciationQuestions.map((question) =>
    withDemoWordReading({
        ...question,
        id: `oral:${question.id}`,
    }),
)

function withDemoWordReading(question: PracticeQuestion): PracticeQuestion {
    const source = getWordDemoReadingSource(question.english)
    return source === undefined ? question : { ...question, readingSource: source }
}

const wordSeedQuestions: readonly PracticeQuestion[] = [
    {
        id: 'woman',
        english: 'woman',
        translation: 'n.妇女；女性；成年女子',
        phonetic: '/ˈwʊmən/',
        tokens: [],
    },
    {
        id: 'woman-review',
        english: 'woman',
        translation: 'n.妇女；女性；成年女子',
        phonetic: '/ˈwʊmən/',
        tokens: [],
    },
].map(withDemoWordPhonetics)

/** 拼写与默写复用十二道本地题；句中练义使用独立语境题库。 */
const wordAnswerQuestions: readonly PracticeQuestion[] = [
    ...wordSeedQuestions,
    ...wordPronunciationQuestions.filter((question) => question.id !== 'woman'),
    {
        id: 'school',
        english: 'school',
        translation: 'n.学校',
        phonetic: '/skuːl/',
        tokens: [],
    },
].map((question) => withDemoWordReading(withDemoWordPhonetics(question)))

const wordMeaningReadingQuestions: readonly PracticeQuestion[] =
    wordMeaningQuestions.map(withDemoWordReading)

/** 纯音频只持有一个待接音源的阅读条目，不借用句子题库。 */
const audioReaderQuestions: readonly PracticeQuestion[] = [
    { id: 'audio-reader-single', english: '', translation: '', phonetic: '', tokens: [] },
]

/** 纯视频只持有一个待接视频的阅读条目，不借用句子题库。 */
const videoReaderQuestions: readonly PracticeQuestion[] = [
    { id: 'video-reader-single', english: '', translation: '', phonetic: '', tokens: [] },
]

/** 空文章的会话载体，仅维持导航与计时；不是正式文章或句子题目。 */
const articleReaderQuestions: readonly PracticeQuestion[] = [
    { id: 'text-reader-empty', english: '', translation: '', phonetic: '', tokens: [] },
]

export function getDemoQuestions(
    family: PracticeFamily,
    mode?: PracticeMode,
): readonly PracticeQuestion[] {
    if (family === 'audio-reader') return audioReaderQuestions
    if (family === 'video-reader') return videoReaderQuestions
    if (family === 'text-reader') return articleReaderQuestions
    if (family === 'picture-reader') return pictureReaderQuestions
    if (family === 'video') return videoListeningQuestions
    if (family === 'typing') return typingGameQuestions
    if (family === 'guess') return guessWordQuestions
    if (mode !== undefined && sentenceModes.includes(mode)) {
        if (family === 'sentence') return sentenceListeningQuestions
        if (family === 'audio') return audioGameQuestions
    }
    if (family === 'word' && (mode === undefined || mode === 'pronounce'))
        return wordPronunciationQuestions
    if (family === 'word' && (mode === 'spell' || mode === 'dictate')) return wordAnswerQuestions
    if (family === 'word' && mode === 'meaning') return wordMeaningReadingQuestions
    if (family === 'word' && mode === 'typing') return wordTypingQuestions
    if (family === 'word' && mode === 'oral') return wordOralQuestions
    if (family === 'phonetics') {
        if (mode !== 'oral') return phoneticsDemoQuestions
        return [
            {
                id: 'understand',
                english: 'understand',
                translation: 'n.理解；了解（设计示例文案待核对）',
                phonetic: '/ʌndəstænd/',
                tokens: [],
            },
            {
                id: 'understand-review',
                english: 'understand',
                translation: 'n.理解；了解（设计示例文案待核对）',
                phonetic: '/ʌndəstænd/',
                tokens: [],
            },
        ].map(withDemoWordPhonetics)
    }
    if (family === 'word') return wordSeedQuestions
    if (family === 'picture') {
        const pictureQuestion =
            mode === 'listen'
                ? { english: 'books', translation: '书', phonetic: '/bʊks/' }
                : mode === 'translate'
                  ? { english: 'brush teeth', translation: '刷牙', phonetic: '/brʌʃ tiːθ/' }
                  : {
                        english: 'Nice to meet you.',
                        translation: '很高兴见到你。',
                        phonetic: '/naɪs tə miːt juː/',
                    }
        return [
            { id: 'picture-example', ...pictureQuestion, tokens: [] },
            { id: 'picture-review', ...pictureQuestion, tokens: [] },
        ].map(withDemoWordPhonetics)
    }

    return [
        {
            id: 'reading',
            english: 'we read books together',
            translation: '我们一起读书',
            phonetic: '/wiː riːd bʊks təˈɡeðə(r)/',
            tokens: readingTokens,
        },
        {
            id: 'reading-review',
            english: 'we read books together',
            translation: '我们一起读书',
            phonetic: '/wiː riːd bʊks təˈɡeðə(r)/',
            tokens: readingTokens,
        },
    ].map(withDemoWordPhonetics)
}
export interface ResolvedPracticeView {
    readonly demo: PracticeDemo
    readonly mode: PracticeMode
}
export type PracticeRouteResult =
    | { readonly kind: 'catalog' }
    | { readonly kind: 'invalid'; readonly message: string }
    | { readonly kind: 'demo'; readonly view: ResolvedPracticeView }
export function resolvePracticeView(demo: string | null, mode: string | null): PracticeRouteResult {
    if (demo === null && mode === null) return { kind: 'catalog' }
    const found = practiceDemos.find((item) => item.id === demo)
    if (!found) return { kind: 'invalid', message: '未找到这份本地演示，请重新选择。' }
    const selected =
        found.modes.find((item) => item === mode) ?? (mode === null ? found.modes[0] : undefined)
    if (!selected) return { kind: 'invalid', message: '此演示不支持所选模式，请重新选择。' }
    return { kind: 'demo', view: { demo: found, mode: selected } }
}
export function practiceViewQuery(search: string, demo: string, mode: PracticeMode): string {
    const resolved = resolvePracticeView(demo, mode)
    if (resolved.kind !== 'demo') throw new Error('Invalid practice demo selection')
    const query = new URLSearchParams(search)
    query.set('demo', demo)
    query.set('mode', mode)
    return `?${query.toString()}`
}
export interface PracticeSession {
    readonly index: number
    readonly phase: PracticePhase
    readonly input: string
    readonly blocks: readonly string[]
    readonly finished: boolean
    readonly spellingStatistics: WordSpellingStatistics
}
export type PracticeSessionAction =
    | { readonly type: 'input'; readonly value: string }
    | { readonly type: 'phase'; readonly phase: PracticePhase }
    | { readonly type: 'move'; readonly delta: number; readonly total: number }
    | { readonly type: 'block'; readonly id: string }
    | {
          readonly type: 'edit-sentence-blocks'
          readonly edit: SentenceBlockEdit
          readonly tokens: readonly PracticeToken[]
      }
    | { readonly type: 'submit-sentence-blocks'; readonly tokens: readonly PracticeToken[] }
    | { readonly type: 'toggle-answer' }
    | { readonly type: 'reset' }
    | { readonly type: 'restart-answer' }
    | { readonly type: 'finish' }
    | {
          readonly type: 'submit-sentence-typing'
          readonly values: readonly string[]
          readonly target: string
          readonly ignoreCase: boolean
      }
    | {
          readonly type: 'submit-sentence-answer'
          readonly values: readonly string[]
          readonly target: string
          readonly ignoreCase: boolean
      }
    | {
          readonly type: 'submit-spelling'
          readonly value: string
          readonly target: string
          readonly ignoreCase: boolean
      }
    | {
          readonly type: 'submit-answer'
          readonly value: string
          readonly target: string
          readonly ignoreCase: boolean
      }
export const initialPracticeSession: PracticeSession = {
    index: 0,
    phase: 'answering',
    input: '',
    blocks: [],
    finished: false,
    spellingStatistics: { submissions: 0, correct: 0 },
}
function isSentenceBlocksResult(phase: PracticePhase): boolean {
    return phase === 'correct' || phase === 'revealed'
}

export function reducePracticeSession(
    state: PracticeSession,
    action: PracticeSessionAction,
): PracticeSession {
    if (action.type === 'toggle-answer')
        return {
            ...state,
            phase:
                state.phase === 'revealed' || state.phase === 'correct' ? 'answering' : 'revealed',
        }
    if (action.type === 'reset') return initialPracticeSession
    if (action.type === 'restart-answer')
        return {
            ...initialPracticeSession,
            index: state.index,
            spellingStatistics: state.spellingStatistics,
        }
    if (action.type === 'edit-sentence-blocks') {
        if (state.finished || isSentenceBlocksResult(state.phase)) return state
        const blocks = editSentenceBlocks(action.tokens, state.blocks, action.edit)
        if (blocks === state.blocks) return state
        const completed =
            action.edit.type === 'toggle' &&
            !state.blocks.includes(action.edit.id) &&
            blocks.length === action.tokens.length
        const judgment = completed ? judgeSentenceBlocks(action.tokens, blocks) : 'empty'
        return { ...state, blocks, phase: judgment === 'empty' ? 'answering' : judgment }
    }
    if (action.type === 'submit-sentence-blocks') {
        if (state.finished || isSentenceBlocksResult(state.phase)) return state
        const judgment = judgeSentenceBlocks(action.tokens, state.blocks)
        return judgment === 'empty' ? state : { ...state, phase: judgment }
    }
    if (action.type === 'submit-sentence-typing' || action.type === 'submit-sentence-answer') {
        if (state.finished || state.phase === 'correct' || state.phase === 'revealed') return state
        const layout = createSentenceAnswerLayout(action.target)
        if (!isSentenceAnswerComplete(layout, action.values)) return state
        const phase = judgeSentenceAnswerValues(layout, action.values, action.ignoreCase)
        if (phase === 'empty') return state
        return {
            ...state,
            input: serializeSentenceAnswer(layout, action.values),
            phase,
            spellingStatistics:
                action.type === 'submit-sentence-answer'
                    ? state.spellingStatistics
                    : {
                          submissions: state.spellingStatistics.submissions + 1,
                          correct: state.spellingStatistics.correct + (phase === 'correct' ? 1 : 0),
                      },
        }
    }
    if (action.type === 'submit-spelling' || action.type === 'submit-answer') {
        if (state.finished || state.phase === 'correct' || state.phase === 'revealed') return state
        const phase = judgeWordSpelling(action.value, action.target, action.ignoreCase)
        if (phase === 'empty') return state
        return {
            ...state,
            input: action.value,
            phase,
            spellingStatistics:
                action.type === 'submit-answer'
                    ? state.spellingStatistics
                    : {
                          submissions: state.spellingStatistics.submissions + 1,
                          correct: state.spellingStatistics.correct + (phase === 'correct' ? 1 : 0),
                      },
        }
    }
    if (action.type === 'input') return { ...state, input: action.value }
    if (action.type === 'phase') return { ...state, phase: action.phase }
    if (action.type === 'finish') return { ...state, finished: true }
    if (action.type === 'block')
        return {
            ...state,
            blocks: state.blocks.includes(action.id)
                ? state.blocks.filter((id) => id !== action.id)
                : [...state.blocks, action.id],
        }
    const index = Math.min(
        Math.max(0, Math.trunc(action.total) - 1),
        Math.max(0, state.index + Math.trunc(action.delta)),
    )
    return index === state.index
        ? state
        : { ...initialPracticeSession, index, spellingStatistics: state.spellingStatistics }
}
