'use client'

import type { CSSProperties, ReactElement } from 'react'
import type { PracticePhase, PracticeQuestion } from '../model/practice-demo'
import wordAsset from '../assets/word-woman-e23d5f.png'
import borderAsset from '../assets/word-card-gradient-border.svg'
import noteAsset from '../assets/word-card-note.svg'
import lookupAsset from '../assets/word-card-lookup.svg'
import addAsset from '../assets/word-card-add.svg'
import { PracticeWordSlotsInput } from './PracticeWordSlotsInput'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'

export interface WordAnswerCardProps {
    readonly question: PracticeQuestion
    readonly mode: 'spell' | 'dictate'
    readonly phase: PracticePhase
    readonly input: string
    readonly onInput: (value: string) => void
    readonly blocked: boolean
    readonly showImage: boolean
    readonly showTranslation: boolean
    readonly showPhonetics: boolean
    readonly onNote: () => void
    readonly onNotice: (message: string) => void
    readonly displayFontSize?: number | undefined
    readonly borderStyle?: 'solid' | 'dashed' | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly onSubmit?: ((value: string) => void) | undefined
}

const phonemes = [
    { id: 'w', text: 'w' },
    { id: 'u', text: 'ʊ' },
    { id: 'm', text: 'm' },
    { id: 'schwa', text: 'ə' },
    { id: 'n', text: 'n' },
] as const

/** 546:31363：只展示已核实的 woman 五音素，不将字符拆分当通用发音解析。 */
function SpellingPhonetics({ question }: { readonly question: PracticeQuestion }): ReactElement {
    if (question.english !== 'woman' || question.phonetic !== '/ˈwʊmən/')
        return <span className="text-[24px] font-normal leading-[normal]">{question.phonetic}</span>
    return (
        <span role="img" aria-label={question.phonetic} className="relative block h-9 w-[188px]">
            <span
                aria-hidden="true"
                className="absolute left-0 top-0.5 text-[24px] font-light leading-[normal] text-practice-muted"
            >
                /
            </span>
            <span aria-hidden="true" className="absolute left-4 top-1 flex gap-1">
                {phonemes.map((phoneme) => (
                    <span
                        key={phoneme.id}
                        className="flex h-[30px] w-7 items-center justify-center rounded-[4px] bg-practice-phoneme text-[24px] font-normal leading-[normal] text-practice-answer"
                    >
                        {phoneme.text}
                    </span>
                ))}
            </span>
            <span
                aria-hidden="true"
                className="absolute left-[176px] top-0.5 text-[24px] font-light leading-[normal] text-practice-muted"
            >
                /
            </span>
        </span>
    )
}

export function WordAnswerCard({
    question,
    mode,
    phase,
    input,
    onInput,
    blocked,
    showImage,
    showTranslation,
    showPhonetics,
    onNote,
    onNotice,
    displayFontSize,
    borderStyle = 'solid',
    reading,
    onSubmit,
}: WordAnswerCardProps): ReactElement {
    const spelling = mode === 'spell'
    const correct = phase === 'correct'
    const revealed = phase === 'revealed'
    const editable = phase === 'answering' || phase === 'incorrect'
    const visibleImage = showImage && !(mode === 'dictate' && correct)
    const referenceLayout = showImage && displayFontSize === undefined
    const englishStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }
    const localInput = (
        <PracticeWordSlotsInput
            target={question.english}
            value={input}
            phase={phase}
            blocked={blocked}
            onChange={onInput}
            displayFontSize={displayFontSize}
            borderStyle={borderStyle}
            compact
            onSubmit={mode === 'spell' ? onSubmit : undefined}
        />
    )

    if (!spelling)
        return (
            <section
                aria-label="单词默写"
                data-reference-node={correct ? '2389:5125' : revealed ? '1609:7642' : '546:31470'}
                className={
                    referenceLayout
                        ? correct
                            ? 'relative mx-auto w-full max-w-[430px] min-w-0 design:h-[320px]'
                            : 'relative mx-auto w-full max-w-[430px] min-w-0 design:h-[510px]'
                        : 'relative mx-auto flex w-full max-w-[430px] min-w-0 flex-col items-center gap-8 py-8'
                }
            >
                {visibleImage && (
                    <div
                        data-practice-reading-surface
                        className="relative w-full overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={wordAsset.src}
                            alt="单词练习共用示意图"
                            width={430}
                            height={revealed ? 240 : 242}
                            style={{ aspectRatio: revealed ? '430/240' : '430/242' }}
                            className="block h-auto w-full rounded-[20px] object-fill"
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                )}
                {revealed && (
                    <aside
                        aria-label="已揭晓的单词答案"
                        className={
                            referenceLayout
                                ? 'z-10 flex min-w-0 flex-col items-center gap-2 rounded-xl border border-primary/30 bg-surface p-5 text-center design:absolute design:-top-[110px] design:h-[173px] design:w-[430px]'
                                : 'flex w-full min-w-0 flex-col items-center gap-2 rounded-xl border border-primary/30 bg-surface p-5 text-center'
                        }
                    >
                        {showPhonetics && (
                            <p
                                className={
                                    referenceLayout
                                        ? 'm-0 text-center text-[14px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[176px] design:top-[39px] design:min-h-5 design:w-[78px]'
                                        : 'm-0 text-[14px] font-normal leading-[normal] text-practice-muted'
                                }
                            >
                                {question.phonetic}
                            </p>
                        )}
                        <p
                            className={
                                referenceLayout
                                    ? 'm-0 border-b-[3px] border-practice-answer text-[22px] font-medium leading-[normal] text-practice-answer design:absolute design:left-[179px] design:top-[63px] design:min-h-[31px] design:w-[75px] design:border-b-0'
                                    : 'm-0 border-b-[3px] border-practice-answer text-[22px] font-medium leading-[normal] text-practice-answer'
                            }
                            style={englishStyle}
                        >
                            {question.english}
                        </p>
                        {referenceLayout && (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none hidden h-[3px] w-[75px] bg-practice-answer design:absolute design:left-[179px] design:top-[98px] design:block"
                            />
                        )}
                        {showTranslation && (
                            <p
                                className={
                                    referenceLayout
                                        ? 'm-0 max-w-full break-words text-[16px] font-normal leading-[normal] text-primary design:absolute design:inset-x-5 design:top-[111px]'
                                        : 'm-0 max-w-full break-words text-[16px] font-normal leading-[normal] text-primary'
                                }
                            >
                                {question.translation}
                            </p>
                        )}
                    </aside>
                )}
                {correct ? (
                    <div
                        className={
                            referenceLayout
                                ? 'flex min-w-0 flex-col items-center gap-5 py-8 design:contents'
                                : 'flex w-full min-w-0 flex-col items-center gap-5 text-center'
                        }
                    >
                        {showPhonetics && (
                            <p
                                className={
                                    referenceLayout
                                        ? 'm-0 text-center text-[30px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[147px] design:top-[140px] design:min-h-[42px] design:w-[134px]'
                                        : 'm-0 text-center text-[30px] font-normal leading-[normal] text-practice-muted'
                                }
                            >
                                {question.phonetic}
                            </p>
                        )}
                        <div
                            className={
                                referenceLayout
                                    ? 'text-center design:absolute design:left-[146px] design:top-[202px] design:w-[137px]'
                                    : 'max-w-full text-center'
                            }
                        >
                            <p
                                data-practice-english
                                className="m-0 break-words text-[40px] font-normal leading-[normal] text-practice-answer"
                                style={englishStyle}
                            >
                                {question.english}
                            </p>
                            <span
                                aria-hidden="true"
                                className={
                                    referenceLayout
                                        ? 'mx-auto mt-[11px] block h-[3px] w-full bg-practice-answer design:absolute design:left-0 design:top-[51px] design:mt-0'
                                        : 'mx-auto mt-[11px] block h-[3px] w-full bg-practice-answer'
                                }
                            />
                        </div>
                        {showTranslation && (
                            <p
                                data-practice-translation
                                className={
                                    referenceLayout
                                        ? 'm-0 max-w-full break-words text-center text-[24px] font-medium leading-[normal] text-practice-text design:absolute design:left-[85px] design:top-[286px] design:min-h-[34px] design:w-[261px]'
                                        : 'm-0 max-w-full break-words text-center text-[24px] font-medium leading-[normal] text-practice-text'
                                }
                            >
                                {question.translation}
                            </p>
                        )}
                    </div>
                ) : (
                    <div
                        className={
                            referenceLayout
                                ? 'flex min-w-0 flex-col items-center gap-8 pb-8 pt-16 design:contents'
                                : 'flex w-full min-w-0 flex-col items-center gap-8'
                        }
                    >
                        {editable && showPhonetics && (
                            <p
                                className={
                                    referenceLayout
                                        ? 'm-0 text-center text-[24px] font-light leading-[normal] text-practice-muted design:absolute design:inset-x-0 design:top-[330px]'
                                        : 'm-0 text-center text-[24px] font-light leading-[normal] text-practice-muted'
                                }
                            >
                                {question.phonetic}
                            </p>
                        )}
                        {editable && (
                            <div
                                className={
                                    referenceLayout
                                        ? 'w-full min-w-0 design:absolute design:inset-x-4 design:top-[390px] design:w-auto design:-translate-y-full'
                                        : 'mt-10'
                                }
                            >
                                {localInput}
                            </div>
                        )}
                        {showTranslation && (
                            <p
                                data-practice-translation
                                className={
                                    referenceLayout
                                        ? 'm-0 max-w-full break-words text-center text-[24px] font-medium leading-[normal] text-practice-text design:absolute design:left-[84px] design:top-[476px] design:min-h-[34px] design:w-[261px]'
                                        : 'm-0 max-w-full break-words text-center text-[24px] font-medium leading-[normal] text-practice-text'
                                }
                            >
                                {question.translation}
                            </p>
                        )}
                    </div>
                )}
                {phase === 'incorrect' && (
                    <p role="status" className="mt-5 text-center text-caption text-danger">
                        答错状态演示，可继续编辑；当前不执行判题。
                    </p>
                )}
            </section>
        )

    return (
        <section
            aria-label="单词拼写"
            data-reference-node="546:31334"
            className="relative mx-auto w-full max-w-[500px] min-w-0"
        >
            <div
                className={
                    referenceLayout
                        ? 'relative rounded-[24px] bg-practice-card shadow-[var(--app-shadow-practice-card)] design:h-[500px]'
                        : 'relative rounded-[24px] bg-practice-card shadow-[var(--app-shadow-practice-card)]'
                }
            >
                {visibleImage && (
                    <div
                        data-practice-reading-surface
                        className="relative overflow-hidden rounded-t-[20px]"
                    >
                        <img
                            data-practice-media
                            src={wordAsset.src}
                            alt="单词练习共用示意图"
                            width={500}
                            height={281}
                            className="block aspect-[500/281] h-auto w-full rounded-t-[20px]"
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                )}
                <div
                    className={
                        referenceLayout
                            ? 'flex min-w-0 flex-col items-center gap-5 px-4 pb-8 pt-16 design:contents'
                            : 'flex min-w-0 flex-col items-center gap-5 px-4 pb-8 pt-16'
                    }
                >
                    <div
                        className={
                            referenceLayout
                                ? 'w-full min-w-0 design:absolute design:inset-x-4 design:top-[343px] design:w-auto design:-translate-y-full'
                                : 'w-full min-w-0'
                        }
                    >
                        {editable ? (
                            localInput
                        ) : (
                            <p
                                data-practice-english
                                className="mx-auto my-0 w-fit max-w-full break-words border-b-2 border-practice-answer text-center text-section-title leading-[normal] text-practice-answer"
                                style={englishStyle}
                            >
                                {question.english}
                            </p>
                        )}
                    </div>
                    {showPhonetics && (
                        <div
                            className={
                                referenceLayout
                                    ? 'design:absolute design:left-[156px] design:top-[360px]'
                                    : ''
                            }
                        >
                            <SpellingPhonetics question={question} />
                        </div>
                    )}
                    {showTranslation && (
                        <p
                            data-practice-translation
                            className={
                                referenceLayout
                                    ? 'm-0 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[160px] design:top-[417px] design:min-h-[25px] design:w-[195px]'
                                    : 'm-0 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted'
                            }
                        >
                            {question.translation}
                        </p>
                    )}
                </div>
                <div
                    aria-label="单词辅助操作"
                    className={
                        referenceLayout
                            ? 'flex items-center gap-[14px] px-[14px] pb-[14px] design:absolute design:inset-x-[14px] design:bottom-[14px] design:px-0 design:pb-0'
                            : 'flex items-center gap-[14px] px-[14px] pb-[14px]'
                    }
                >
                    <button
                        type="button"
                        disabled={blocked}
                        aria-label="记录当前单词笔记"
                        onClick={onNote}
                        className="size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
                    >
                        <img
                            src={noteAsset.src}
                            alt=""
                            width={32}
                            height={32}
                            className="[filter:var(--app-filter-practice-icon)]"
                        />
                    </button>
                    <button
                        type="button"
                        disabled={blocked}
                        aria-label="查词"
                        onClick={(): void => onNotice('查词暂未接入，当前只展示本地词条。')}
                        className="size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
                    >
                        <img
                            src={lookupAsset.src}
                            alt=""
                            width={32}
                            height={32}
                            className="[filter:var(--app-filter-practice-icon)]"
                        />
                    </button>
                    <button
                        type="button"
                        disabled={blocked}
                        aria-label="添加当前单词"
                        onClick={(): void => onNotice('添加单词仅作界面演示，暂不保存到词本。')}
                        className="ml-auto size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
                    >
                        <img
                            src={addAsset.src}
                            alt=""
                            width={32}
                            height={32}
                            className="[filter:var(--app-filter-practice-icon)]"
                        />
                    </button>
                </div>
                <img
                    data-word-card-border
                    aria-hidden="true"
                    alt=""
                    src={borderAsset.src}
                    width={500}
                    height={500}
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                />
            </div>
            {phase === 'incorrect' && (
                <p role="status" className="mt-5 text-center text-caption text-danger">
                    拼写不正确，请修改后重新提交。
                </p>
            )}
        </section>
    )
}
