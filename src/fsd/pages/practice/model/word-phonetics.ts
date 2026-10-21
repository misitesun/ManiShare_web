export type WordPhoneticMode = 'original' | 'syllables' | 'phonics' | 'none'

export interface WordPhoneticSegment {
    readonly id: string
    readonly ipa: string
    /** 发音对应的显式字母片段；缺失时输入区回退整词，不从IPA猜字母。 */
    readonly spelling?: string
}

export interface WordPhoneticGroup {
    readonly id: string
    readonly word: string
    readonly segments: readonly WordPhoneticSegment[]
}

/** 来自题目的显式分组；音节和发音片段各自维护，不从 IPA 字符推断。 */
export interface WordPhoneticBreakdown {
    readonly syllables: readonly WordPhoneticGroup[]
    readonly phonics: readonly WordPhoneticGroup[]
}

export interface WordPhoneticDisplay {
    readonly phonetic: string
    readonly groups: readonly WordPhoneticGroup[]
}

export function formatWordPhonetic(phonetic: string): string {
    const content = phonetic
        .trim()
        .replace(/^\/+|\/+$/g, '')
        .trim()
    return content ? `/${content}/` : ''
}

/** 缺组、空组或局部缺失时显示完整音标，不用不完整分组冒充整条题目。 */
export function resolveWordPhoneticDisplay(
    phonetic: string,
    mode: WordPhoneticMode,
    breakdown?: WordPhoneticBreakdown,
): WordPhoneticDisplay | null {
    if (mode === 'none') return null
    const formatted = formatWordPhonetic(phonetic)
    if (!formatted) return null
    const groups = mode === 'original' ? undefined : breakdown?.[mode]
    if (!groups?.length) return { phonetic: formatted, groups: [] }
    const visibleGroups = groups.map((group) => ({
        ...group,
        segments: group.segments.filter((segment) => segment.ipa.trim()),
    }))
    return {
        phonetic: formatted,
        groups: visibleGroups.every((group) => group.segments.length > 0) ? visibleGroups : [],
    }
}
