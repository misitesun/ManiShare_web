'use client'

import type { ReactElement } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import { getWordCardOutlineRadius } from '../model/word-card-outline'
import wordAsset from '../assets/word-woman-e23d5f.png'
import knownAsset from '../assets/known.svg'
import retryAsset from '../assets/retry.svg'
import borderAsset from '../assets/word-card-gradient-border.svg'
import nearBorderAsset from '../assets/word-card-back-near.svg'
import farBorderAsset from '../assets/word-card-back-far.svg'
import guidelineAsset from '../assets/word-card-guideline.svg'
import playAsset from '../assets/word-card-play.svg'
import noteAsset from '../assets/word-card-note.svg'
import lookupAsset from '../assets/word-card-lookup.svg'
import addAsset from '../assets/word-card-add.svg'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { WordRememberFeedback } from './WordRememberFeedback'

export interface WordPronunciationCardProps {
    question: PracticeQuestion
    showImage: boolean
    showTranslation: boolean
    showPhonetics?: boolean
    onPlay: () => void
    onNote: () => void
    onLookup: () => void
    onAdd: () => void
    displayFontSize?: number | undefined
    disabled?: boolean
    borderDepth?: 'front' | 'near' | 'far'
    reading?: PracticeReadingView | undefined
}

const womanPhonemes = [
    { id: 'w', text: 'w', x: 3, y: 3 },
    { id: 'u', text: 'ʊ', x: 5, y: 2 },
    { id: 'm', text: 'm', x: 2, y: 2 },
    { id: 'schwa', text: 'ə', x: 5, y: 2 },
    { id: 'n', text: 'n', x: 5, y: 3 },
] as const

/** 546:31300 的五音素示例，不将字符拆分冒充通用音素解析。 */
function PronunciationPhonemes({ question }: { question: PracticeQuestion }): ReactElement {
    if (question.english !== 'woman' || question.phonetic !== '/ˈwʊmən/')
        return <span className="text-[24px] font-light leading-[normal]">{question.phonetic}</span>

    return (
        <span
            role="img"
            aria-label={question.phonetic}
            className="relative block h-[35px] w-[148px] shrink-0"
        >
            <span
                aria-hidden="true"
                className="absolute left-0 top-0 text-[24px] font-light leading-[normal] text-practice-muted"
            >
                /
            </span>
            <span aria-hidden="true" className="absolute left-4 top-0.5 flex gap-1">
                {womanPhonemes.map((phoneme) => (
                    <span
                        key={phoneme.id}
                        className="relative h-[30px] w-5 rounded-[4px] bg-practice-phoneme text-[18px] font-normal leading-[normal] text-practice-answer"
                    >
                        <span className="absolute" style={{ left: phoneme.x, top: phoneme.y }}>
                            {phoneme.text}
                        </span>
                    </span>
                ))}
            </span>
            <span
                aria-hidden="true"
                className="absolute left-[136px] top-px text-[24px] font-light leading-[normal] text-practice-muted"
            >
                /
            </span>
        </span>
    )
}

export function WordPronunciationCard({
    question,
    showImage,
    showTranslation,
    showPhonetics = true,
    onPlay,
    onNote,
    onLookup,
    onAdd,
    displayFontSize,
    disabled = false,
    borderDepth = 'front',
    reading,
}: WordPronunciationCardProps): ReactElement {
    const referenceLayout = showImage && displayFontSize === undefined
    const cardBorder =
        borderDepth === 'near'
            ? nearBorderAsset
            : borderDepth === 'far'
              ? farBorderAsset
              : borderAsset
    return (
        <article
            data-word-card-face
            aria-label="单词拼读卡片"
            className="relative mx-auto w-full max-w-[500px] min-w-0"
        >
            <div className="relative">
                <div
                    data-word-card-surface
                    style={{ borderRadius: getWordCardOutlineRadius(borderDepth) }}
                    className={
                        referenceLayout
                            ? 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)] design:h-[500px]'
                            : 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)]'
                    }
                >
                    {showImage && (
                        <div
                            data-practice-reading-surface
                            className="relative overflow-hidden rounded-t-[20px]"
                        >
                            <img
                                data-practice-media
                                src={wordAsset.src}
                                alt="单词练习共用演示插图"
                                width={500}
                                height={281}
                                draggable={false}
                                className="block aspect-[500/281] h-auto w-full rounded-t-[20px] object-fill"
                            />
                            <PracticeReadingOverlay reading={reading} />
                        </div>
                    )}
                    <div
                        className={
                            referenceLayout
                                ? 'flex min-w-0 flex-col items-center px-4 pb-10 pt-6 text-center design:contents'
                                : 'flex min-w-0 flex-col items-center gap-5 px-4 py-10 text-center'
                        }
                    >
                        <div
                            className={
                                referenceLayout
                                    ? 'relative design:absolute design:left-[179px] design:top-[305px] design:h-[53px] design:w-[142px]'
                                    : 'relative flex min-w-0 flex-wrap items-center justify-center gap-4'
                            }
                        >
                            {[8, 23, 38, 53].map((top) => (
                                <img
                                    key={top}
                                    data-word-card-guideline
                                    alt=""
                                    src={guidelineAsset.src}
                                    style={{ top: top - 0.5 }}
                                    className="pointer-events-none absolute -left-[10px] hidden h-px w-[162px] max-w-none design:block [filter:var(--app-filter-practice-icon)]"
                                />
                            ))}
                            <h2
                                data-practice-english
                                style={
                                    displayFontSize === undefined
                                        ? undefined
                                        : { fontSize: displayFontSize }
                                }
                                className={
                                    referenceLayout
                                        ? 'relative m-0 max-w-full whitespace-nowrap text-[32px] font-semibold leading-[normal] tracking-[0.08em] text-practice-answer md:text-[38px]'
                                        : 'relative m-0 max-w-full break-words text-[32px] font-semibold leading-[normal] tracking-[0.08em] text-practice-answer md:text-[38px]'
                                }
                            >
                                {question.english}
                            </h2>
                            <button
                                type="button"
                                disabled={disabled}
                                aria-label="朗读当前单词"
                                onClick={onPlay}
                                className={
                                    referenceLayout
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
                        {showPhonetics && (
                            <div
                                className={
                                    referenceLayout
                                        ? 'mt-5 design:absolute design:left-1/2 design:top-[379px] design:mt-0 design:-translate-x-1/2'
                                        : ''
                                }
                            >
                                <PronunciationPhonemes question={question} />
                            </div>
                        )}
                        {showTranslation && (
                            <p
                                data-practice-translation
                                className={
                                    referenceLayout
                                        ? 'm-0 mt-5 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[166px] design:top-[434px] design:mt-0 design:w-[195px]'
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
                            disabled={disabled}
                            aria-label="记录当前单词笔记"
                            onClick={onNote}
                            className="size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
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
                            disabled={disabled}
                            aria-label="查词"
                            onClick={onLookup}
                            className="size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
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
                            disabled={disabled}
                            aria-label="添加当前单词"
                            onClick={onAdd}
                            className="ml-auto size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
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
                    {/* 描边盖在声纹遮罩之上，避免图片底部出现明暗断层。 */}
                    <img
                        data-word-card-border
                        aria-hidden="true"
                        alt=""
                        src={cardBorder.src}
                        width={500}
                        height={500}
                        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                    />
                </div>
            </div>
        </article>
    )
}

export function WordPronunciationActions({
    onRetry,
    onKnown,
    disabled,
    remembering,
    onRememberFeedbackComplete,
}: {
    readonly onRetry: () => void
    readonly onKnown: () => void
    readonly disabled: boolean
    readonly remembering: boolean
    readonly onRememberFeedbackComplete: () => void
}): ReactElement {
    return (
        <div
            data-word-card-actions
            className="mt-8 flex justify-center gap-20 design:mt-[39px] design:justify-start design:gap-[122px] design:pl-[123px]"
        >
            <button
                type="button"
                disabled={disabled}
                aria-label="再来，将当前单词放到待练队尾"
                onClick={onRetry}
                className="flex w-[66px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl text-[18px] font-normal leading-[normal] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
            >
                <img src={retryAsset.src} alt="" width={66} height={66} className="size-[66px]" />
                <span className="relative -left-px">再来</span>
            </button>
            <button
                type="button"
                disabled={disabled}
                aria-label="记住当前单词"
                aria-busy={remembering}
                onClick={onKnown}
                className="flex w-[66px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl text-[18px] font-normal leading-[normal] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
            >
                <span className="relative block size-[66px]">
                    <img
                        src={knownAsset.src}
                        alt=""
                        width={66}
                        height={66}
                        className="size-[66px]"
                    />
                    <WordRememberFeedback
                        active={remembering}
                        onComplete={onRememberFeedbackComplete}
                    />
                </span>
                <span>记住</span>
            </button>
        </div>
    )
}
