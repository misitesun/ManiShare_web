/** 页面内部课程模型，真实接口接入时由适配器映射，不作为后台 DTO。 */
export interface PhoneticsLesson {
    readonly id: string
    readonly title: string
    readonly targetPhonetic: string
    readonly readingSource?: string
    readonly mnemonic: string
    readonly tips: readonly string[]
}

export interface PhoneticsWordSegment {
    readonly id: string
    readonly spelling: string
    readonly ipa: string
    readonly readingSource?: string
}

export interface PhoneticsWordContent {
    readonly lesson: PhoneticsLesson
    /** 显式提供字母与发音的对应关系；不按 IPA 字符猜测拆分。 */
    readonly segments: readonly PhoneticsWordSegment[]
}
