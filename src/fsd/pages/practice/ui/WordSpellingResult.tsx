import type { ReactElement } from 'react'
import { getWordSpellingAccuracy } from '../model/word-spelling'
import type { WordSpellingStatistics } from '../model/word-spelling'
import { PracticeOralAssessmentButton } from './PracticeOralAssessmentButton'

interface WordSpellingResultProps {
    readonly statistics: WordSpellingStatistics | null
    readonly oralEnabled: boolean
    readonly disabled?: boolean
    readonly onOral: () => void
}

export function WordSpellingResult({
    statistics,
    oralEnabled,
    disabled = false,
    onOral,
}: WordSpellingResultProps): ReactElement {
    return (
        <section
            data-word-input-result
            data-word-spelling-result={statistics !== null || undefined}
            aria-label={statistics !== null ? '本轮拼写统计' : '默写结果区'}
            className="mx-auto mb-4 mt-auto flex w-full min-w-0 shrink-0 flex-col items-center gap-[37px] px-4 pt-8 design:pt-[53px]"
        >
            <div
                data-word-input-oral-slot
                data-word-spelling-oral-slot
                aria-hidden={!oralEnabled}
                className="flex h-[46px] w-full min-w-0 shrink-0 justify-center"
            >
                {oralEnabled && (
                    <PracticeOralAssessmentButton disabled={disabled} onClick={onOral} />
                )}
            </div>
            <div
                data-word-input-statistics-slot
                aria-hidden={statistics === null}
                className="flex min-h-[68px] w-full shrink-0 justify-center"
            >
                {statistics !== null && (
                    <dl
                        data-word-spelling-statistics
                        className="m-0 grid min-h-[68px] w-full max-w-[385px] grid-cols-3 gap-2 rounded-b-[24px] border-b border-practice-muted px-3 py-1.5 text-center tracking-[0.08em] md:gap-[26px]"
                    >
                        {[
                            { label: '输入数', value: statistics.submissions },
                            { label: '正确数', value: statistics.correct },
                            { label: '正确率', value: `${getWordSpellingAccuracy(statistics)}%` },
                        ].map((item) => (
                            <div key={item.label}>
                                <dt className="text-[14px] font-normal leading-[22px] text-practice-muted md:text-[16px]">
                                    {item.label}
                                </dt>
                                <dd className="m-0 mt-[5px] text-[16px] font-medium leading-[25px] tracking-[0.08em] text-practice-text md:text-[18px]">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </section>
    )
}
