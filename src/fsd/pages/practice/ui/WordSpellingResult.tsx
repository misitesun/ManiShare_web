import type { ReactElement, ReactNode } from 'react'
import type { WordSpellingStatistics } from '../model/word-spelling'
import { PracticeOralAssessmentButton } from './PracticeOralAssessmentButton'
import { PracticeAnswerStatistics } from './PracticeAnswerStatistics'

interface WordSpellingResultProps {
    readonly statistics: WordSpellingStatistics | null
    readonly oralEnabled: boolean
    readonly disabled?: boolean
    readonly onOral: () => void
    readonly controls?: ReactNode
}

export function WordSpellingResult({
    statistics,
    oralEnabled,
    disabled = false,
    onOral,
    controls,
}: WordSpellingResultProps): ReactElement {
    return (
        <section
            data-word-input-result
            data-word-spelling-result={statistics !== null || undefined}
            aria-label={
                statistics !== null ? '本轮拼写统计' : controls ? '句中练义操作区' : '默写结果区'
            }
            className={
                controls
                    ? 'mx-auto mb-4 mt-auto flex w-full min-w-0 shrink-0 flex-col items-center gap-[37px] px-4 pt-8 design:pt-10'
                    : 'mx-auto mb-4 mt-auto flex w-full min-w-0 shrink-0 flex-col items-center gap-[37px] px-4 pt-8 design:pt-[53px]'
            }
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
                aria-hidden={statistics === null && !controls}
                className="flex min-h-[68px] w-full shrink-0 items-center justify-center"
            >
                {controls}
                {statistics !== null && <PracticeAnswerStatistics statistics={statistics} />}
            </div>
        </section>
    )
}
