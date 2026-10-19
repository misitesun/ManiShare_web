export type SentenceToolbarMode =
    'listen' | 'read' | 'translate' | 'check' | 'typing' | 'oral' | 'blocks'

export interface SentenceToolbarOptions {
    split: boolean
    copy: boolean
    imageVisible: boolean
    translationVisible: boolean
    cutReading: boolean
}

export type SentenceToolbarRow =
    'split' | 'copy' | 'imageVisible' | 'translationVisible' | 'cutReading'

export const sentenceToolbarRows: Readonly<
    Record<SentenceToolbarMode, readonly SentenceToolbarRow[]>
> = {
    listen: ['split', 'imageVisible', 'cutReading'],
    read: [],
    translate: ['split', 'copy', 'imageVisible', 'translationVisible', 'cutReading'],
    check: ['split', 'imageVisible', 'cutReading'],
    typing: ['split', 'copy', 'imageVisible', 'cutReading'],
    oral: ['split', 'imageVisible', 'translationVisible', 'cutReading'],
    blocks: ['split', 'imageVisible', 'translationVisible', 'cutReading'],
}

export function isSentenceToolbarMode(value: string): value is SentenceToolbarMode {
    return (
        value === 'listen' ||
        value === 'read' ||
        value === 'translate' ||
        value === 'check' ||
        value === 'typing' ||
        value === 'oral' ||
        value === 'blocks'
    )
}

/** split=false 表示完整；这里只保存截图选择，不执行拆句、抄写或切读。 */
export function createSentenceToolbarOptions(mode: SentenceToolbarMode): SentenceToolbarOptions {
    const options: SentenceToolbarOptions = {
        split: true,
        copy: false,
        imageVisible: true,
        translationVisible: true,
        cutReading: true,
    }
    if (mode === 'listen' || mode === 'read') return { ...options, split: false }
    if (mode === 'translate' || mode === 'typing') return { ...options, copy: true }
    return options
}

/** 无翻译控件时保留题面的既有门控；调用方仍需限定为句子族。 */
export function getSentenceToolbarTranslationOverride(
    mode: SentenceToolbarMode,
    options: SentenceToolbarOptions,
): boolean | undefined {
    return sentenceToolbarRows[mode].includes('translationVisible')
        ? options.translationVisible
        : undefined
}
