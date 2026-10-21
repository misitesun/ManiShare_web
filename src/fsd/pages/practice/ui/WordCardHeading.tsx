import type { ReactElement } from 'react'
import guidelineAsset from '../assets/word-card-guideline.svg'
import playAsset from '../assets/word-card-play.svg'

interface WordCardHeadingProps {
    readonly word: string
    readonly referenceLayout: boolean
    readonly onPlay: () => void
    readonly hideEnglish?: boolean
    readonly displayFontSize?: number | undefined
    readonly disabled?: boolean
    readonly placement?: 'card' | 'slot'
}

/** 拼读及拼写／默写正确态共用的四线单词与朗读入口。 */
export function WordCardHeading({
    word,
    referenceLayout,
    onPlay,
    hideEnglish = false,
    displayFontSize,
    disabled = false,
    placement = 'card',
}: WordCardHeadingProps): ReactElement {
    return (
        <div
            className={
                placement === 'slot'
                    ? 'relative mt-6 w-max min-w-0 max-w-[calc(100%-120px)] text-center'
                    : referenceLayout
                      ? 'relative min-w-0 max-w-full text-center design:absolute design:left-1/2 design:top-[305px] design:h-[53px] design:w-max design:max-w-[calc(100%-120px)] design:-translate-x-1/2'
                      : 'relative flex min-w-0 max-w-full flex-wrap items-center justify-center gap-4 text-center'
            }
        >
            <div className="relative min-w-0 max-w-full">
                {[8, 23, 38, 53].map((top) => (
                    <img
                        key={top}
                        data-word-card-guideline
                        aria-hidden="true"
                        alt=""
                        src={guidelineAsset.src}
                        style={{ top: `${(top / 53) * 100}%` }}
                        className="pointer-events-none absolute -left-[10px] block h-px w-[calc(100%+20px)] max-w-none -translate-y-1/2 [filter:var(--app-filter-practice-icon)]"
                    />
                ))}
                <h2
                    data-practice-english
                    aria-hidden={hideEnglish || undefined}
                    style={
                        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }
                    }
                    className="relative m-0 max-w-full break-words text-[32px] font-semibold leading-[normal] tracking-[0.08em] text-practice-answer md:text-[38px]"
                >
                    <span className={hideEnglish ? 'invisible' : undefined}>{word}</span>
                </h2>
            </div>
            <button
                type="button"
                disabled={disabled}
                aria-label="朗读当前单词"
                onClick={onPlay}
                className={
                    placement === 'slot' || referenceLayout
                        ? 'absolute -right-[61px] top-[13px] size-8 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default'
                        : 'size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default'
                }
            >
                <img
                    src={playAsset.src}
                    alt=""
                    width={32}
                    height={32}
                    className="[filter:var(--app-filter-practice-icon)]"
                />
            </button>
        </div>
    )
}
