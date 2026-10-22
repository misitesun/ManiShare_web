import type { ReactElement } from 'react'
import { getWordSpellingAccuracy } from '../model/word-spelling'
import type { WordSpellingStatistics } from '../model/word-spelling'

interface PracticeAnswerStatisticsProps {
    readonly statistics: WordSpellingStatistics
    readonly variant?: 'spelling' | 'typing'
}

/** 统计只消费会话提交结果，不按字母数或题态另行累加。 */
export function PracticeAnswerStatistics({
    statistics,
    variant = 'spelling',
}: PracticeAnswerStatisticsProps): ReactElement {
    return (
        <dl
            data-practice-answer-statistics
            data-word-spelling-statistics={variant === 'spelling' || undefined}
            data-word-typing-statistics={variant === 'typing' || undefined}
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
    )
}
