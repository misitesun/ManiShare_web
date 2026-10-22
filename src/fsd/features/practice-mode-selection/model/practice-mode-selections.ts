import listeningThumbnailAsset from '../assets/listening-thumbnail.png'
import readingThumbnailAsset from '../assets/reading-thumbnail.png'
import selfCheckThumbnailAsset from '../assets/self-check-thumbnail.png'
import sentenceTranslationThumbnailAsset from '../assets/sentence-translation-thumbnail.png'
import translationThumbnailAsset from '../assets/translation-thumbnail.png'
import blocksThumbnailAsset from '../assets/word-blocks-thumbnail.png'
import sentenceBlocksThumbnailAsset from '../assets/word-spelling-thumbnail.png'
import typingThumbnailAsset from '../assets/typing-thumbnail.png'
import oralThumbnailAsset from '../assets/oral-assessment-thumbnail.png'
import guessThumbnailAsset from '../assets/guess-thumbnail.png'
import guessReadingThumbnailAsset from '../assets/guess-reading-thumbnail.png'
import guessTypingThumbnailAsset from '../assets/guess-typing-thumbnail.png'
import listeningPreviewAsset from '../assets/listening.png'
import readingPreviewAsset from '../assets/reading.png'
import selfCheckPreviewAsset from '../assets/self-check.png'
import translationPreviewAsset from '../assets/translation.png'
import blocksPreviewAsset from '../assets/word-blocks.png'
import sentenceBlocksPreviewAsset from '../assets/sentence-word-blocks.png'
import typingPreviewAsset from '../assets/sentence-typing.png'
import oralPreviewAsset from '../assets/sentence-oral-assessment.png'
import guessPreviewAsset from '../assets/guess.png'
import guessReadingPreviewAsset from '../assets/guess-reading.png'
import guessTypingPreviewAsset from '../assets/guess-typing.png'
import { wordPracticeModeOptions, type WordPracticeMode } from './word-practice-modes'

export type SelectablePracticeFamily = 'word' | 'sentence' | 'audio' | 'video' | 'guess' | 'picture'

export type PracticeSelectionMode =
    WordPracticeMode | 'listen' | 'read' | 'check' | 'translate' | 'blocks' | 'guess'

export interface PracticeModeOption {
    readonly id: PracticeSelectionMode
    readonly label: string
    readonly thumbnail: string
    readonly preview: string
}

export interface PracticeModeSelection {
    readonly family: SelectablePracticeFamily
    readonly title: string
    readonly defaultMode: PracticeSelectionMode
    readonly options: readonly PracticeModeOption[]
    readonly reference: {
        readonly width: number
        readonly height: number
        readonly x: number
        readonly y: number
        readonly rowGap: number
        readonly captionTop: number
        readonly dimInactiveThumbnail: boolean
        readonly solidSurface: boolean
    }
}

const listeningOption: PracticeModeOption = {
    id: 'listen',
    label: '沉浸听力',
    thumbnail: listeningThumbnailAsset.src,
    preview: listeningPreviewAsset.src,
}

const readingOption: PracticeModeOption = {
    id: 'read',
    label: '阅读全浏',
    thumbnail: readingThumbnailAsset.src,
    preview: readingPreviewAsset.src,
}

const selfCheckOption: PracticeModeOption = {
    id: 'check',
    label: '理解自查',
    thumbnail: selfCheckThumbnailAsset.src,
    preview: selfCheckPreviewAsset.src,
}

const translationOption: PracticeModeOption = {
    id: 'translate',
    label: '中译英',
    thumbnail: translationThumbnailAsset.src,
    preview: translationPreviewAsset.src,
}

const blocksOption: PracticeModeOption = {
    id: 'blocks',
    label: '选词拼块',
    thumbnail: blocksThumbnailAsset.src,
    preview: blocksPreviewAsset.src,
}

const typingOption: PracticeModeOption = {
    id: 'typing',
    label: '指法练习',
    thumbnail: typingThumbnailAsset.src,
    preview: typingPreviewAsset.src,
}

const oralOption: PracticeModeOption = {
    id: 'oral',
    label: '口语评测',
    thumbnail: oralThumbnailAsset.src,
    preview: oralPreviewAsset.src,
}

export const practiceModeSelections: Readonly<
    Record<SelectablePracticeFamily, PracticeModeSelection>
> = {
    word: {
        family: 'word',
        title: '选择模式',
        defaultMode: 'pronounce',
        options: wordPracticeModeOptions,
        reference: {
            width: 819,
            height: 547,
            x: 550,
            y: 266,
            rowGap: 12,
            captionTop: 364,
            dimInactiveThumbnail: false,
            solidSurface: false,
        },
    },
    sentence: {
        family: 'sentence',
        title: '选择模式',
        defaultMode: 'listen',
        options: [
            listeningOption,
            { ...readingOption, label: '阅读全览' },
            selfCheckOption,
            { ...translationOption, thumbnail: sentenceTranslationThumbnailAsset.src },
            {
                ...blocksOption,
                thumbnail: sentenceBlocksThumbnailAsset.src,
                preview: sentenceBlocksPreviewAsset.src,
            },
            typingOption,
            oralOption,
        ],
        reference: {
            width: 819,
            height: 621,
            x: 550,
            y: 229,
            rowGap: 12,
            captionTop: 366,
            dimInactiveThumbnail: false,
            solidSurface: false,
        },
    },
    audio: {
        family: 'audio',
        title: '选择模式',
        defaultMode: 'listen',
        options: [
            listeningOption,
            readingOption,
            selfCheckOption,
            translationOption,
            blocksOption,
            typingOption,
            oralOption,
        ],
        reference: {
            width: 819,
            height: 621,
            x: 550,
            y: 229,
            rowGap: 12,
            captionTop: 370,
            dimInactiveThumbnail: true,
            solidSurface: false,
        },
    },
    video: {
        family: 'video',
        title: '选择模式',
        defaultMode: 'listen',
        options: [
            listeningOption,
            selfCheckOption,
            translationOption,
            blocksOption,
            typingOption,
            oralOption,
        ],
        reference: {
            width: 819,
            height: 547,
            x: 551,
            y: 267,
            rowGap: 12,
            captionTop: 366,
            dimInactiveThumbnail: true,
            solidSurface: false,
        },
    },
    guess: {
        family: 'guess',
        title: '选择模式',
        defaultMode: 'guess',
        options: [
            {
                id: 'guess',
                label: '猜词模式',
                thumbnail: guessThumbnailAsset.src,
                preview: guessPreviewAsset.src,
            },
            {
                id: 'read',
                label: '阅读模式',
                thumbnail: guessReadingThumbnailAsset.src,
                preview: guessReadingPreviewAsset.src,
            },
            {
                id: 'spell',
                label: '打词模式',
                thumbnail: guessTypingThumbnailAsset.src,
                preview: guessTypingPreviewAsset.src,
            },
        ],
        reference: {
            width: 819,
            height: 547,
            x: 551,
            y: 267,
            rowGap: 12,
            captionTop: 366,
            dimInactiveThumbnail: true,
            solidSurface: true,
        },
    },
    picture: {
        family: 'picture',
        title: '选择模式',
        defaultMode: 'listen',
        options: [listeningOption, translationOption, typingOption, oralOption],
        reference: {
            width: 820,
            height: 536,
            x: 551,
            y: 230,
            rowGap: 13,
            captionTop: 366,
            dimInactiveThumbnail: true,
            solidSurface: false,
        },
    },
}

export function isSelectablePracticeFamily(value: unknown): value is SelectablePracticeFamily {
    return (
        typeof value === 'string' &&
        Object.prototype.hasOwnProperty.call(practiceModeSelections, value)
    )
}

export function isPracticeSelectionMode(
    family: SelectablePracticeFamily,
    value: unknown,
): value is PracticeSelectionMode {
    return practiceModeSelections[family].options.some((option) => option.id === value)
}
