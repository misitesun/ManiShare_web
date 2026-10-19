export type PhoneticsReadingStep = 'target-phonetic' | 'word' | 'phonics'

/** 用户确认的阶段顺序；phonics阶段需由题目提供多个真实音段，不在此生成音源。 */
export function createPhoneticsReadingPlan(
    naturalPhonics: boolean,
): readonly PhoneticsReadingStep[] {
    return naturalPhonics
        ? ['target-phonetic', 'word', 'phonics', 'word']
        : ['target-phonetic', 'word']
}

export function describePhoneticsReadingPlan(naturalPhonics: boolean): string {
    const labels: Readonly<Record<PhoneticsReadingStep, string>> = {
        'target-phonetic': '目标音标',
        word: '单词',
        phonics: '自然拼读音段',
    }
    return createPhoneticsReadingPlan(naturalPhonics)
        .map((step) => labels[step])
        .join(' → ')
}
