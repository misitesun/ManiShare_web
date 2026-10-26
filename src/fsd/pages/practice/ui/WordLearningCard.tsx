'use client'

import type { ReactElement, ReactNode } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordPhoneticMode } from '../model/word-phonetics'
import { getWordCardOutlineRadius } from '../model/word-card-outline'
import wordAsset from '../assets/word-woman-e23d5f.png'
import borderAsset from '../assets/word-card-gradient-border.svg'
import nearBorderAsset from '../assets/word-card-back-near.svg'
import farBorderAsset from '../assets/word-card-back-far.svg'
import analysisAsset from '../assets/word-card-note.svg'
import lookupAsset from '../assets/word-card-lookup.svg'
import addAsset from '../assets/word-card-add.svg'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'
import { WordDictionaryLink } from './WordDictionaryLink'
import { WordCardHeading } from './WordCardHeading'

export interface WordLearningCardProps {
    readonly question: PracticeQuestion
    readonly showImage: boolean
    readonly showTranslation: boolean
    readonly hideEnglish?: boolean
    readonly hideTranslation?: boolean
    readonly showPhonetics?: boolean
    readonly phoneticMode?: WordPhoneticMode
    readonly onPlay: () => void
    readonly analysisId: string
    readonly analysisOpen?: boolean
    readonly onAnalysis: () => void
    readonly onAdd: () => void
    readonly displayFontSize?: number | undefined
    readonly disabled?: boolean
    readonly borderDepth?: 'front' | 'near' | 'far'
    readonly reading?: PracticeReadingView | undefined
    readonly layout?: 'word' | 'guess'
    readonly imageSource?: string | undefined
    readonly imageAlt?: string
    readonly phoneticControls?: ReactNode
    /** 仅猜词浮窗限制卡面高度，滚动留在随卡翻转的正面内部。 */
    readonly cardHeight?: number
}

function WordCardContent({
    compact,
    disabled,
    children,
}: {
    readonly compact: boolean
    readonly disabled: boolean
    readonly children: ReactNode
}): ReactElement {
    if (!compact) return <>{children}</>
    return (
        <div
            data-word-card-scroll
            role="region"
            aria-label="单词卡片内容，可滚动"
            tabIndex={disabled ? -1 : 0}
            className="h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        >
            <div className="relative min-h-full xl:min-h-[394px]">{children}</div>
        </div>
    )
}

export function WordLearningCard({
    question,
    showImage,
    showTranslation,
    hideEnglish = false,
    hideTranslation = false,
    showPhonetics = true,
    phoneticMode = 'original',
    onPlay,
    onAnalysis,
    analysisId,
    analysisOpen = false,
    onAdd,
    displayFontSize,
    disabled = false,
    borderDepth = 'front',
    reading,
    layout = 'word',
    imageSource,
    imageAlt = '单词练习共用演示插图',
    phoneticControls,
    cardHeight = 394,
}: WordLearningCardProps): ReactElement {
    const compact = layout === 'guess'
    const referenceLayout = !compact && showImage && displayFontSize === undefined
    const cardBorder =
        borderDepth === 'near'
            ? nearBorderAsset
            : borderDepth === 'far'
              ? farBorderAsset
              : borderAsset
    return (
        <article
            data-word-card-face
            aria-label={compact ? '猜词答案卡片' : '单词拼读卡片'}
            className={
                compact
                    ? 'relative mx-auto w-full max-w-[360px] min-w-0'
                    : 'relative mx-auto w-full max-w-[500px] min-w-0'
            }
        >
            <div className="relative">
                <div
                    data-word-card-surface
                    style={{
                        borderRadius: getWordCardOutlineRadius(borderDepth),
                        height: compact ? cardHeight : undefined,
                    }}
                    className={
                        compact
                            ? 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)]'
                            : referenceLayout
                              ? 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)] design:h-[500px]'
                              : 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)]'
                    }
                >
                    <WordCardContent compact={compact} disabled={disabled}>
                        {showImage && (
                            <div
                                data-practice-reading-surface
                                className={
                                    compact
                                        ? 'relative aspect-video w-full overflow-hidden'
                                        : 'relative aspect-video w-full overflow-hidden rounded-t-[20px]'
                                }
                            >
                                <img
                                    data-practice-media
                                    src={imageSource ?? wordAsset.src}
                                    alt={imageAlt}
                                    width={500}
                                    height={281}
                                    draggable={false}
                                    className="absolute inset-0 block h-full w-full object-cover"
                                />
                                <PracticeReadingOverlay reading={reading} />
                            </div>
                        )}
                        <div
                            className={
                                compact
                                    ? 'flex min-w-0 flex-col items-center px-3 pb-3 pt-[11px] text-center xl:contents'
                                    : referenceLayout
                                      ? 'flex min-w-0 flex-col items-center px-4 pb-10 pt-6 text-center design:contents'
                                      : 'flex min-w-0 flex-col items-center gap-5 px-4 py-10 text-center'
                            }
                        >
                            <WordCardHeading
                                word={question.english}
                                referenceLayout={referenceLayout}
                                hideEnglish={hideEnglish}
                                displayFontSize={displayFontSize}
                                disabled={disabled}
                                onPlay={onPlay}
                                compact={compact}
                            />
                            {showPhonetics && phoneticMode !== 'none' && (
                                <div
                                    className={
                                        compact
                                            ? 'mt-5 max-w-[calc(100%-24px)] xl:absolute xl:left-1/2 xl:top-[263px] xl:mt-0 xl:-translate-x-1/2'
                                            : referenceLayout
                                              ? 'mt-5 max-w-[calc(100%-32px)] design:absolute design:left-1/2 design:top-[379px] design:mt-0 design:-translate-x-1/2'
                                              : 'max-w-full'
                                    }
                                >
                                    <PracticeWordPhonetics
                                        phonetic={question.phonetic}
                                        breakdown={question.wordPhonetics}
                                        mode={phoneticMode}
                                        density="pronunciation"
                                    />
                                </div>
                            )}
                            {showTranslation && (
                                <p
                                    data-practice-translation
                                    aria-hidden={hideTranslation || undefined}
                                    className={
                                        compact
                                            ? 'm-0 mt-[14px] max-w-full break-words text-center text-[14px] font-normal leading-5 text-practice-muted xl:absolute xl:inset-x-3 xl:top-[309px] xl:mt-0'
                                            : referenceLayout
                                              ? 'm-0 mt-5 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[166px] design:top-[434px] design:mt-0 design:w-[195px]'
                                              : 'm-0 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted'
                                    }
                                >
                                    <span className={hideTranslation ? 'invisible' : ''}>
                                        {question.translation}
                                    </span>
                                </p>
                            )}
                            {phoneticControls && (
                                <div className="mt-3 w-max max-w-[calc(100%-24px)] xl:absolute xl:left-1/2 xl:top-[342px] xl:mt-0 xl:-translate-x-1/2">
                                    {phoneticControls}
                                </div>
                            )}
                        </div>
                        <div
                            aria-label="单词辅助操作"
                            className={
                                compact
                                    ? 'flex items-center gap-[10px] px-3 pb-3 pt-3 xl:absolute xl:inset-x-3 xl:bottom-3 xl:px-0 xl:pb-0 xl:pt-0 [&_img]:size-6 [&_button]:size-6 [&_a]:size-6'
                                    : referenceLayout
                                      ? 'flex items-center gap-[14px] px-[14px] pb-[14px] design:absolute design:inset-x-[14px] design:bottom-[14px] design:px-0 design:pb-0'
                                      : 'flex items-center gap-[14px] px-[14px] pb-[14px]'
                            }
                        >
                            <button
                                type="button"
                                disabled={disabled}
                                data-word-analysis-trigger
                                aria-label="查看当前单词解析"
                                aria-controls={analysisId}
                                aria-expanded={analysisOpen}
                                onClick={onAnalysis}
                                className="size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                            >
                                <img
                                    src={analysisAsset.src}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="[filter:var(--app-filter-practice-icon)]"
                                />
                            </button>
                            <WordDictionaryLink
                                word={question.english}
                                disabled={disabled}
                                appearance="front"
                            >
                                <img
                                    src={lookupAsset.src}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="[filter:var(--app-filter-practice-icon)]"
                                />
                            </WordDictionaryLink>
                            <button
                                type="button"
                                disabled={disabled}
                                aria-label="标记当前单词为不熟"
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
                    </WordCardContent>
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
