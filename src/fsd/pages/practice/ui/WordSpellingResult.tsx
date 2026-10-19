import type { ReactElement } from 'react'
import { getWordSpellingAccuracy } from '../model/word-spelling'
import type { WordSpellingStatistics } from '../model/word-spelling'

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
            className="mx-auto mb-4 mt-8 flex w-full min-w-0 flex-col items-center gap-[37px] px-4 design:mt-[53px]"
        >
            {oralEnabled && (
                <button
                    type="button"
                    data-practice-quick-oral
                    data-practice-command="practice.oral"
                    onClick={onOral}
                    className="h-[46px] max-w-full cursor-pointer rounded-full bg-linear-to-r from-brand-start to-brand-end p-px outline-none focus-visible:ring-2 focus-visible:ring-focus md:w-[234px]"
                >
                    <span className="flex h-full items-center justify-center gap-0.5 rounded-full bg-canvas px-3 text-[14px] font-medium tracking-[0.08em] text-practice-text md:px-0 md:text-[16px]">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 28 28"
                            className="size-7 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <rect x="10" y="3" width="8" height="14" rx="4" />
                            <path d="M6 12v2a8 8 0 0 0 16 0v-2M14 22v4m-4 0h8" />
                        </svg>
                        口语评测<span className="hidden md:inline">·点击或字母V</span>
                    </span>
                </button>
            )}
            <dl className="m-0 grid min-h-[68px] w-full max-w-[385px] grid-cols-3 gap-2 rounded-b-[24px] border-b border-practice-muted px-3 py-1.5 text-center tracking-[0.08em] md:gap-[26px]">
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
