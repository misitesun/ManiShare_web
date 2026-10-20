import type { ReactElement } from 'react'
import { resolveWordPhoneticDisplay } from '../model/word-phonetics'
import type { WordPhoneticBreakdown, WordPhoneticMode } from '../model/word-phonetics'

interface PracticeWordPhoneticsProps {
    readonly phonetic: string
    readonly breakdown?: WordPhoneticBreakdown | undefined
    readonly mode?: WordPhoneticMode | undefined
    readonly density?: 'pronunciation' | 'spelling' | 'inherit'
}

/** 练习页共用音标展示；只读题目分组，不判题、不拆字、不创建声音或输入状态。 */
export function PracticeWordPhonetics({
    phonetic,
    breakdown,
    mode = 'original',
    density = 'inherit',
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
            role="img"
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
                aria-hidden="true"
                className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1"
            >
                {display.groups.map((group) => (
                    <span
                        key={group.id}
                        className="inline-flex max-w-full items-center gap-1 overflow-x-auto"
                    >
                        {group.segments.map((segment) => (
                            <span
                                key={segment.id}
                                data-word-phonetic-segment
                                className={
                                    density === 'pronunciation'
                                        ? 'inline-flex h-[30px] min-w-5 shrink-0 items-center justify-center rounded-[4px] bg-practice-phoneme px-[3px] text-[18px] font-normal leading-[normal] text-practice-answer'
                                        : density === 'spelling'
                                          ? 'inline-flex h-[30px] min-w-7 shrink-0 items-center justify-center rounded-[4px] bg-practice-phoneme px-1 text-[24px] font-normal leading-[normal] text-practice-answer'
                                          : 'inline-flex min-h-[1.5em] shrink-0 items-center justify-center rounded-[4px] bg-practice-phoneme px-1 font-normal text-practice-answer'
                                }
                            >
                                {segment.ipa}
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
