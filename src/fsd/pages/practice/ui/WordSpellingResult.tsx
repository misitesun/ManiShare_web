import type { ReactElement } from 'react'
import { getWordSpellingAccuracy } from '../model/word-spelling'
import type { WordSpellingStatistics } from '../model/word-spelling'
import oralIcon from '../assets/sentence-listening-oral.svg'

export function WordSpellingResult({
    statistics,
    oralEnabled,
    onOral,
}: {
    readonly statistics: WordSpellingStatistics
    readonly oralEnabled: boolean
    readonly onOral: () => void
}): ReactElement {
    return (
        <section
            data-word-spelling-result
            aria-label="本轮拼写统计"
            className="mx-auto mb-4 mt-auto flex w-full min-w-0 shrink-0 flex-col items-center gap-[37px] px-4 pt-8 design:pt-[53px]"
        >
            <div
                data-word-spelling-oral-slot
                aria-hidden={!oralEnabled}
                className="flex h-[46px] w-full min-w-0 shrink-0 justify-center"
            >
                {oralEnabled && (
                    <button
                        type="button"
                        data-practice-quick-oral
                        data-practice-command="practice.oral"
                        onClick={onOral}
                        className="h-[46px] w-[234px] max-w-full cursor-pointer rounded-[25px] bg-linear-[127deg] from-brand-start to-brand-end p-px outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                        <span className="flex size-full items-center justify-center gap-0.5 rounded-[inherit] bg-practice-background px-2 text-[14px] font-medium leading-[normal] tracking-[0.08em] text-practice-text md:px-0 md:text-[16px]">
                            <img
                                src={oralIcon.src}
                                alt=""
                                width={28}
                                height={28}
                                className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                            />
                            口语评测<span className="hidden md:inline">·点击或字母V</span>
                        </span>
                    </button>
                )}
            </div>
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
        </section>
    )
}
