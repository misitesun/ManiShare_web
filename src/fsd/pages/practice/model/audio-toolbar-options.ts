export type AudioToolbarMode =
    'listen' | 'read' | 'translate' | 'check' | 'typing' | 'oral' | 'blocks'

export interface AudioToolbarOptions {
    copy: boolean
    imageVisible: boolean
    translationVisible: boolean
    cutReading: boolean
}

export type AudioToolbarRow = 'copy' | 'imageVisible' | 'translationVisible' | 'cutReading'

export const audioToolbarRows: Readonly<Record<AudioToolbarMode, readonly AudioToolbarRow[]>> = {
    listen: ['imageVisible', 'cutReading'],
    read: [],
    translate: ['copy', 'imageVisible', 'translationVisible', 'cutReading'],
    check: ['imageVisible', 'cutReading'],
    typing: ['copy', 'imageVisible', 'cutReading'],
    oral: ['imageVisible', 'translationVisible', 'cutReading'],
    blocks: ['imageVisible', 'translationVisible', 'cutReading'],
}

export function isAudioToolbarMode(value: string): value is AudioToolbarMode {
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

/** 音频所有模式均无拆分；实际抄写和切读由共用题面及朗读宿主消费。 */
export function createAudioToolbarOptions(mode: AudioToolbarMode): AudioToolbarOptions {
    return {
        copy: mode === 'translate' || mode === 'typing',
        imageVisible: true,
        translationVisible: true,
        cutReading: true,
    }
}

/** 无翻译控件时保留题面原有规则；调用方仍需限定为音频游戏族。 */
export function getAudioToolbarTranslationOverride(
    mode: AudioToolbarMode,
    options: AudioToolbarOptions,
): boolean | undefined {
    return audioToolbarRows[mode].includes('translationVisible')
        ? options.translationVisible
        : undefined
}
