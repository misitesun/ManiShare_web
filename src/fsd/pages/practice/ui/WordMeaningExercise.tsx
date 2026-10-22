'use client'

import { useMemo } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import type { PracticePhase, PracticeQuestion } from '../model/practice-demo'
import type { WordMeaningContent, WordMeaningVariant } from '../model/word-meaning'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import { createWordSpellingLayout } from '../model/word-spelling-input'
import { getWordMeaningReference } from '../model/reference-layout'
import wordAsset from '../assets/word-woman-e23d5f.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { PracticeAnswerInput } from './PracticeAnswerInput'

interface WordMeaningStyle extends CSSProperties {
    '--word-meaning-top': string
    '--word-meaning-sentence-gap': string
}

const illustrations: Readonly<Record<WordMeaningContent['illustration'], string>> = {
    'park-woman': wordAsset.src,
}

export interface WordMeaningExerciseProps {
    readonly question: PracticeQuestion
    readonly variant: WordMeaningVariant
    readonly phase: PracticePhase
    readonly input: string
    readonly blocked: boolean
    readonly imageVisible: boolean
    readonly phoneticsVisible: boolean
    readonly translationVisible: boolean
    readonly ignoreCase: boolean
    readonly displayFontSize?: number | undefined
    readonly borderStyle?: 'solid' | 'dashed' | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly onInput: (value: string) => void
    readonly onSubmit?: ((value: string) => void) | undefined
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
    readonly onRevealTranslation: () => void
}

/** 题面只消费片段与父级题态；定位、纠错和提交交给默写同一输入器。 */
export function WordMeaningExercise({
    question,
    variant,
    phase,
    input,
    blocked,
    imageVisible,
    phoneticsVisible,
    translationVisible,
    ignoreCase,
    displayFontSize,
    borderStyle,
    reading,
    onInput,
    onSubmit,
    onController,
    onRevealTranslation,
}: WordMeaningExerciseProps): ReactElement {
    const layout = useMemo(
        () => createWordSpellingLayout(question.english, 'syllables'),
        [question.english],
    )
    const content = question.wordMeaning
    if (!content)
        return (
            <p className="px-4 pt-20 text-center text-body text-secondary">
                当前题目缺少句中练义内容。
            </p>
        )
    const fill = variant === 'fill'
    const editable = fill && (phase === 'answering' || phase === 'incorrect')
    const reference = getWordMeaningReference(variant)
    const style: WordMeaningStyle = {
        '--word-meaning-top': `${reference.top}px`,
        '--word-meaning-sentence-gap': `${reference.sentenceGap}px`,
    }
    const englishStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }
    return (
        <article
            data-word-meaning-exercise={variant}
            data-reference-node={reference.node}
            style={style}
            className="relative w-full min-w-0 shrink-0 px-4 pt-16 design:pt-[var(--word-meaning-top)]"
        >
            {imageVisible && (
                <div
                    data-practice-reading-surface
                    className="relative mx-auto aspect-video w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={illustrations[content.illustration]}
                        alt={content.imageAlt}
                        width={reference.mediaWidth}
                        height={reference.mediaHeight}
                        className="absolute inset-0 block h-full w-full object-cover"
                    />
                    <PracticeReadingOverlay reading={reading} />
                </div>
            )}
            <div
                className={
                    !imageVisible
                        ? 'mx-auto max-w-[1100px] min-w-0 text-center'
                        : fill
                          ? 'mx-auto mt-16 max-w-[1100px] min-w-0 text-center design:mt-[var(--word-meaning-sentence-gap)]'
                          : 'mx-auto mt-8 max-w-[1100px] min-w-0 text-center design:mt-[var(--word-meaning-sentence-gap)]'
                }
            >
                <div
                    data-practice-english
                    aria-label="句中练义英文题面"
                    style={englishStyle}
                    className="min-h-[56px] min-w-0 break-words text-[28px] font-normal leading-[normal] text-practice-text md:text-[34px] design:text-[40px]"
                >
                    <span>{content.before}</span>
                    <div
                        data-word-meaning-word-slot
                        className={
                            fill
                                ? 'inline-grid max-w-full items-baseline align-baseline [font-kerning:none]'
                                : 'inline-grid max-w-full align-baseline'
                        }
                    >
                        <span
                            aria-hidden="true"
                            data-word-meaning-word-measure
                            className={
                                fill
                                    ? 'invisible col-start-1 row-start-1 min-w-0 break-all px-2.5 pb-3 leading-none'
                                    : 'invisible col-start-1 row-start-1 min-w-0 break-all px-[0.12em]'
                            }
                        >
                            {question.english}
                        </span>
                        <div className="col-start-1 row-start-1 min-w-0">
                            {editable ? (
                                <PracticeAnswerInput
                                    key={`latin:${question.english}`}
                                    layout={layout}
                                    initialValue={input}
                                    blocked={blocked}
                                    ignoreCase={ignoreCase}
                                    showWordHint={false}
                                    presentation="inline"
                                    displayFontSize={displayFontSize}
                                    borderStyle={borderStyle}
                                    label="填写句子中的单词"
                                    onChange={onInput}
                                    onSubmit={onSubmit}
                                    onController={onController}
                                />
                            ) : (
                                <span
                                    data-word-meaning-answer
                                    className={
                                        fill
                                            ? 'inline-block px-2.5 pb-3 leading-none text-practice-answer'
                                            : 'inline-block px-[0.12em] text-practice-answer'
                                    }
                                >
                                    {question.english}
                                </span>
                            )}
                        </div>
                    </div>
                    <span>{content.after}</span>
                </div>
                <div className="mt-4 flex min-h-[42px] min-w-0 items-center justify-center design:mt-6">
                    {phoneticsVisible && (
                        <p
                            data-word-meaning-phonetic
                            className="m-0 break-words text-[24px] font-normal leading-[normal] text-practice-muted md:text-[30px]"
                        >
                            {question.phonetic}
                        </p>
                    )}
                </div>
                {fill ? (
                    <>
                        <p
                            data-word-meaning-definition
                            className="m-0 mt-6 min-h-[34px] break-words text-[18px] font-normal leading-[normal] text-practice-muted md:text-[24px]"
                        >
                            {question.translation}
                        </p>
                        <WordMeaningTranslation question={question} />
                    </>
                ) : (
                    <div className="mt-6 flex min-h-[102px] min-w-0 items-start justify-center">
                        {translationVisible ? (
                            <WordMeaningTranslation question={question} context />
                        ) : (
                            <button
                                type="button"
                                data-word-meaning-reveal
                                aria-label="显示本句中文翻译"
                                disabled={blocked}
                                onClick={onRevealTranslation}
                                className="min-h-10 cursor-pointer rounded-[6px] border-0 bg-practice-control-surface px-3 text-[16px] font-normal leading-[normal] text-practice-control-text outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default md:min-h-[46px] md:text-[20px]"
                            >
                                <span className="hidden md:inline">空格</span>显示中文
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    )
}

function WordMeaningTranslation({
    question,
    context = false,
}: {
    readonly question: PracticeQuestion
    readonly context?: boolean
}): ReactElement | null {
    const content = question.wordMeaning
    if (!content) return null
    return (
        <p
            data-word-meaning-translation
            aria-live={context ? 'polite' : undefined}
            className={
                context
                    ? 'm-0 min-h-[42px] min-w-0 break-words text-center text-[22px] font-normal leading-[normal] text-practice-text md:text-[30px]'
                    : 'm-0 mt-6 min-h-[42px] min-w-0 break-words text-center text-[22px] font-normal leading-[normal] text-practice-text md:text-[30px] design:mt-[30px]'
            }
        >
            {content.translationBefore}
            <span data-word-meaning-translation-target className="text-practice-answer">
                {content.translationTarget}
            </span>
            {content.translationAfter}
        </p>
    )
}

/** 占用原统计槽；两项作为同一模式内的玩法选择，不新增路由或持久化值。 */
export function WordMeaningVariantSwitch({
    value,
    disabled,
    onChange,
}: {
    readonly value: WordMeaningVariant
    readonly disabled: boolean
    readonly onChange: (variant: WordMeaningVariant) => void
}): ReactElement {
    return (
        <div
            data-word-meaning-variants
            role="group"
            aria-label="句中练义玩法"
            className="grid min-h-[46px] w-[292px] max-w-full grid-cols-2 overflow-hidden rounded-[6px] border border-practice-control-accent"
        >
            {[
                { id: 'fill', label: '打词填空' },
                { id: 'context', label: '句中辩义' },
            ].map((item) => (
                <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={value === item.id}
                    onClick={(): void => onChange(item.id === 'fill' ? 'fill' : 'context')}
                    className={
                        value === item.id
                            ? 'min-h-11 cursor-pointer border-0 bg-practice-control-accent px-3 text-[16px] font-normal leading-[normal] text-practice-text outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:cursor-default md:text-[20px]'
                            : 'min-h-11 cursor-pointer border-0 bg-transparent px-3 text-[16px] font-normal leading-[normal] text-practice-control-accent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:cursor-default md:text-[20px]'
                    }
                >
                    {item.label}
                </button>
            ))}
        </div>
    )
}
