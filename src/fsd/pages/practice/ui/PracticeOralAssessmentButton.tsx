import type { ReactElement } from 'react'
import oralIcon from '../assets/sentence-listening-oral.svg'

/** 单词作答正确态共用入口；阶段与快捷键由练习会话拥有。 */
export function PracticeOralAssessmentButton({
    onClick,
    disabled = false,
}: {
    readonly onClick: () => void
    readonly disabled?: boolean
}): ReactElement {
    return (
        <button
            type="button"
            data-practice-quick-oral
            data-practice-command="practice.oral"
            disabled={disabled}
            onClick={onClick}
            className="h-[46px] w-[234px] max-w-full cursor-pointer rounded-[25px] bg-linear-[127deg] from-brand-start to-brand-end p-px outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
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
    )
}
