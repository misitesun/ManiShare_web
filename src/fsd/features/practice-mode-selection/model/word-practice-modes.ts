import pronunciationThumbnailAsset from '../assets/word-pronunciation-thumbnail.png'
import spellingThumbnailAsset from '../assets/word-spelling-thumbnail.png'
import dictationThumbnailAsset from '../assets/word-dictation-thumbnail.png'
import meaningThumbnailAsset from '../assets/context-meaning-thumbnail.png'
import typingThumbnailAsset from '../assets/typing-thumbnail.png'
import oralThumbnailAsset from '../assets/oral-assessment-thumbnail.png'
import pronunciationPreviewAsset from '../assets/word-pronunciation.png'
import spellingPreviewAsset from '../assets/word-spelling.png'
import dictationPreviewAsset from '../assets/word-dictation.png'
import meaningPreviewAsset from '../assets/context-meaning.png'
import typingPreviewAsset from '../assets/typing.png'
import oralPreviewAsset from '../assets/oral-assessment.png'

export type WordPracticeMode = 'pronounce' | 'spell' | 'dictate' | 'meaning' | 'typing' | 'oral'

export interface WordPracticeModeOption {
    readonly id: WordPracticeMode
    readonly label: string
    readonly thumbnail: string
    readonly preview: string
}

const pronunciationOption: WordPracticeModeOption = {
    id: 'pronounce',
    label: '单词拼读',
    thumbnail: pronunciationThumbnailAsset.src,
    preview: pronunciationPreviewAsset.src,
}

export const wordPracticeModeOptions: readonly WordPracticeModeOption[] = [
    pronunciationOption,
    {
        id: 'spell',
        label: '单词拼写',
        thumbnail: spellingThumbnailAsset.src,
        preview: spellingPreviewAsset.src,
    },
    {
        id: 'dictate',
        label: '单词默写',
        thumbnail: dictationThumbnailAsset.src,
        preview: dictationPreviewAsset.src,
    },
    {
        id: 'meaning',
        label: '句中练义',
        thumbnail: meaningThumbnailAsset.src,
        preview: meaningPreviewAsset.src,
    },
    {
        id: 'typing',
        label: '指法练习',
        thumbnail: typingThumbnailAsset.src,
        preview: typingPreviewAsset.src,
    },
    {
        id: 'oral',
        label: '口语评测',
        thumbnail: oralThumbnailAsset.src,
        preview: oralPreviewAsset.src,
    },
]

export function isWordPracticeMode(value: unknown): value is WordPracticeMode {
    return wordPracticeModeOptions.some((option) => option.id === value)
}

export function getWordPracticeModeOption(mode: WordPracticeMode): WordPracticeModeOption {
    return wordPracticeModeOptions.find((option) => option.id === mode) ?? pronunciationOption
}
