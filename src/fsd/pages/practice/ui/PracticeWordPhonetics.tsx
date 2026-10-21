import type { ReactElement } from 'react'
import { resolveWordPhoneticDisplay } from '../model/word-phonetics'
import type { WordPhoneticBreakdown, WordPhoneticMode } from '../model/word-phonetics'

interface PracticeWordPhoneticsProps {
    readonly phonetic: string
    readonly breakdown?: WordPhoneticBreakdown | undefined
    readonly mode?: WordPhoneticMode | undefined
    readonly density?: 'pronunciation' | 'spelling' | 'inherit'
    readonly onSegmentSelect?: ((id: string) => void) | undefined
    readonly disabled?: boolean
}

/** 练习页共用音标展示；拼写可注入定位事件，组件自身不拆字、不判题或创建声音。 */
export function PracticeWordPhonetics({
    phonetic,
    breakdown,
    mode = 'original',
    density = 'inherit',
    onSegmentSelect,
    disabled = false,
}: PracticeWordPhoneticsProps): ReactElement | null {
    const display = resolveWordPhoneticDisplay(phonetic, mode, breakdown)
    if (!display) return null
    if (display.groups.length === 0)
        return (
            <span
                data-word-phonetics="original"
                className={
                    density === 'inherit'
                        ? 'max-w-full break-words'
                        : density === 'spelling'
                          ? 'max-w-full break-words text-[24px] font-normal leading-[normal] text-practice-answer'
                          : 'max-w-full break-words text-[24px] font-light leading-[normal] text-practice-answer'
                }
            >
                {density === 'inherit' ? (
                    display.phonetic
                ) : (
                    <>
                        <span className="text-practice-muted">/</span>
                        {display.phonetic.slice(1, -1)}
                        <span className="text-practice-muted">/</span>
                    </>
                )}
            </span>
        )
    return (
        <span
            data-word-phonetics={mode}
            role={onSegmentSelect ? 'group' : 'img'}
            aria-label={display.phonetic}
            className={
                density === 'inherit'
                    ? 'inline-flex max-w-full items-center justify-center gap-1 align-middle'
                    : 'inline-flex min-h-[35px] max-w-full items-center justify-center gap-1 align-middle text-[24px] font-light leading-[normal] text-practice-muted'
            }
        >
            <span aria-hidden="true" className="shrink-0">
                /
            </span>
            <span
                aria-hidden={onSegmentSelect ? undefined : true}
                className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1"
            >
                {display.groups.map((group) => (
                    <span
                        key={group.id}
                        className={
                            density === 'spelling'
                                ? 'inline-flex min-w-0 max-w-full flex-wrap items-center justify-center gap-1'
                                : 'inline-flex max-w-full items-center gap-1 overflow-x-auto'
                        }
                    >
                        {group.segments.map((segment) => (
                            <span
                                key={segment.id}
                                data-word-phonetic-segment
                                className={
                                    density === 'pronunciation'
                                        ? 'relative inline-flex h-[30px] min-w-5 shrink-0 items-center justify-center rounded-[4px] bg-practice-phoneme px-[3px] text-[18px] font-normal leading-[normal] text-practice-answer'
                                        : density === 'spelling'
                                          ? 'relative inline-flex h-[30px] min-w-7 shrink-0 items-center justify-center rounded-[4px] bg-practice-phoneme px-1 text-[24px] font-normal leading-none text-practice-answer'
                                          : 'relative inline-flex min-h-[1.5em] shrink-0 items-center justify-center rounded-[4px] bg-practice-phoneme px-1 font-normal text-practice-answer'
                                }
                            >
                                {onSegmentSelect ? (
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        aria-label={`定位 ${group.word} 中的 ${segment.spelling ?? segment.ipa}`}
                                        onClick={(): void => onSegmentSelect(segment.id)}
                                        className="flex h-full min-w-full cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                                    >
                                        <span
                                            data-spelling-pulse-segment={segment.id}
                                            className="pointer-events-none absolute inset-0 rounded-[4px] bg-practice-control-accent/25 opacity-0"
                                        />
                                        <span className="relative">{segment.ipa}</span>
                                    </button>
                                ) : (
                                    segment.ipa
                                )}
                            </span>
                        ))}
                    </span>
                ))}
            </span>
            <span aria-hidden="true" className="shrink-0">
                /
            </span>
        </span>
    )
}
