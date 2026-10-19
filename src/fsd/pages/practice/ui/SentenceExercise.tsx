'use client'

import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion, PracticeSession, PracticeToken } from '../model/practice-demo'
import { getSentenceExerciseReference, type SentenceExerciseMode } from '../model/reference-layout'
import { isPracticeAnswerVisible } from '../model/practice-visibility'
import { AnnotatedText } from './AnnotatedText'
import sentenceAsset from '../assets/reading-scene.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import { PracticeWordSlotsInput } from './PracticeWordSlotsInput'
import type { PracticeReadingView } from './PracticeReadingOverlay'

interface SlotStyle extends CSSProperties {
    '--sentence-slot-top': string
    '--sentence-flow-gap': string
    '--sentence-slot-offset': string
}

interface BlockStyle extends CSSProperties {
    '--sentence-block-width'?: string
}

export interface SentenceExerciseProps {
    readonly question: PracticeQuestion
    readonly mode: SentenceExerciseMode
    readonly session: PracticeSession
    readonly values: LearningPreferences
    readonly imageVisible: boolean
    readonly translationVisible?: boolean
    readonly blocked: boolean
    readonly onInput: (value: string) => void
    readonly onBlock: (id: string) => void
    readonly onReveal: () => void
    readonly reading?: PracticeReadingView | undefined
}

interface SentenceSlotProps {
    readonly top: number
    readonly exactLayout: boolean
    readonly kind: 'media' | 'english' | 'translation' | 'input' | 'reveal' | 'tray' | 'candidates'
    readonly offset?: number
    readonly children: ReactNode
}

function SentenceSlot({
    top,
    exactLayout,
    kind,
    offset = 0,
    children,
}: SentenceSlotProps): ReactElement {
    const style: SlotStyle = {
        '--sentence-slot-top': `${top - 75}px`,
        '--sentence-flow-gap': kind === 'media' ? '0px' : kind === 'input' ? '72px' : '32px',
        '--sentence-slot-offset': exactLayout ? `${offset}px` : '0px',
    }
    const innerClassName =
        kind === 'media'
            ? 'w-full max-w-[430px] design:translate-x-[var(--sentence-slot-offset)]'
            : kind === 'english' || kind === 'translation'
              ? 'w-full max-w-[900px] text-center design:translate-x-[var(--sentence-slot-offset)]'
              : kind === 'input'
                ? 'w-full max-w-[900px] design:translate-x-[var(--sentence-slot-offset)]'
                : kind === 'tray'
                  ? 'w-full max-w-[794px] design:translate-x-[var(--sentence-slot-offset)]'
                  : kind === 'candidates'
                    ? 'flex w-fit max-w-full flex-wrap items-center justify-center gap-3 md:gap-5 design:max-w-[794px] design:translate-x-[var(--sentence-slot-offset)] design:gap-[40px]'
                    : 'w-fit design:translate-x-[var(--sentence-slot-offset)]'
    return (
        <div
            data-sentence-slot-top={top}
            className={
                exactLayout
                    ? 'mt-[var(--sentence-flow-gap)] flex w-full flex-col items-center design:absolute design:inset-x-0 design:top-[var(--sentence-slot-top)] design:mt-0'
                    : 'mt-[var(--sentence-flow-gap)] flex w-full flex-col items-center'
            }
            style={style}
        >
            <div className={innerClassName}>{children}</div>
        </div>
    )
}

interface SentenceBlockProps {
    readonly token: PracticeToken
    readonly values: LearningPreferences
    readonly selected: boolean
    readonly disabled: boolean
    readonly onBlock: (id: string) => void
}

/** 只记录本地 reading 示例的设计尺寸；不是分词或答案规则。 */
const readingBlockWidths: Readonly<Record<string, number>> = {
    we: 78,
    read: 100,
    books: 132,
    together: 154,
}
const readingCandidateOrder = ['read', 'together', 'we', 'books']

function SentenceBlock({
    token,
    values,
    selected,
    disabled,
    onBlock,
}: SentenceBlockProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    const width = readingBlockWidths[token.id]
    const style: BlockStyle = {
        ...(values.fontSize === '默认' && width !== undefined
            ? { '--sentence-block-width': `${width}px` }
            : {}),
        ...(values.fontSize !== '默认' ? { fontSize: appearance.fontSize } : {}),
        ...(values.fontSize === '默认' ? { height: 64 } : {}),
        borderStyle: appearance.borderStyle,
    }
    return (
        <button
            type="button"
            data-sentence-block={token.id}
            aria-label={selected ? `撤回 ${token.text}` : `选择 ${token.text}`}
            disabled={disabled}
            onClick={(): void => onBlock(token.id)}
            style={style}
            className={
                selected
                    ? 'inline-flex min-h-12 max-w-full cursor-pointer items-center justify-center break-words rounded-lg border border-sentence-block-selected-border bg-sentence-block-selected pb-[4px] pl-[14px] pr-[15px] pt-[5px] text-[26px] font-normal text-practice-answer shadow-[var(--app-shadow-sentence-block-selected)] outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed md:min-h-16 md:text-[32px] design:min-h-[64px] design:w-[var(--sentence-block-width)] design:text-[38px]'
                    : token.id === 'together'
                      ? 'inline-flex min-h-12 max-w-full cursor-pointer items-center justify-center break-words rounded-lg border border-sentence-block-border bg-sentence-block pb-[4px] pl-[14px] pr-[15px] pt-[5px] text-[26px] font-normal text-practice-answer/80 outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-sentence-block-disabled-border disabled:bg-sentence-block-disabled disabled:text-practice-answer/15 md:min-h-16 md:text-[30px] design:min-h-[64px] design:w-[var(--sentence-block-width)] design:text-[34px]'
                      : 'inline-flex min-h-12 max-w-full cursor-pointer items-center justify-center break-words rounded-lg border border-sentence-block-border bg-sentence-block pb-[4px] pl-[14px] pr-[15px] pt-[5px] text-[26px] font-normal text-practice-answer/80 outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-sentence-block-disabled-border disabled:bg-sentence-block-disabled disabled:text-practice-answer/15 md:min-h-16 md:text-[32px] design:min-h-[64px] design:w-[var(--sentence-block-width)] design:text-[38px]'
            }
        >
            {token.text}
        </button>
    )
}

export function SentenceExercise({
    question,
    mode,
    session,
    values,
    imageVisible,
    translationVisible,
    blocked,
    onInput,
    onBlock,
    onReveal,
    reading,
}: SentenceExerciseProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    const reference = getSentenceExerciseReference(mode, session.phase)
    const answerVisible = isPracticeAnswerVisible(session.phase)
    const exactLayout =
        imageVisible && values.fontSize === '默认' && values.grammarFontSize === '默认'
    const candidates = question.tokens.slice().sort((left, right): number => {
        const leftIndex = readingCandidateOrder.indexOf(left.id)
        const rightIndex = readingCandidateOrder.indexOf(right.id)
        return (
            (leftIndex < 0 ? readingCandidateOrder.length : leftIndex) -
            (rightIndex < 0 ? readingCandidateOrder.length : rightIndex)
        )
    })
    return (
        <section
            aria-label="句子练习"
            data-reference-node={reference.node}
            className={
                exactLayout
                    ? 'relative mx-auto flex min-w-0 flex-col items-center px-4 pb-12 pt-16 md:px-6 design:min-h-[calc(100svh-175px)] design:pt-0'
                    : 'relative mx-auto flex min-w-0 flex-col items-center px-4 pb-12 pt-16 md:px-6'
            }
        >
            {reference.mediaTop !== null && imageVisible && (
                <SentenceSlot top={reference.mediaTop} exactLayout={exactLayout} kind="media">
                    <div
                        data-practice-reading-surface
                        className="relative overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={sentenceAsset.src}
                            alt="句子练习示例插图"
                            className="block h-auto w-full rounded-[20px] object-cover"
                            style={{ aspectRatio: '430 / 242' }}
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                </SentenceSlot>
            )}
            {(reference.englishTop !== null || reference.annotationTop !== null) && (
                <SentenceSlot
                    top={reference.englishTop ?? reference.annotationTop ?? 532}
                    exactLayout={exactLayout}
                    kind="english"
                    offset={-1}
                >
                    <div
                        style={
                            !answerVisible ? { filter: `blur(${appearance.blur}px)` } : undefined
                        }
                    >
                        <AnnotatedText
                            question={question}
                            values={values}
                            annotated={answerVisible}
                            titleFirstWord
                        />
                    </div>
                </SentenceSlot>
            )}
            {reference.translationTop !== null &&
                (translationVisible ??
                    (values.showTranslation || mode === 'translate' || mode === 'blocks')) && (
                    <SentenceSlot
                        top={reference.translationTop}
                        exactLayout={exactLayout}
                        kind="translation"
                        offset={reference.translationOffset}
                    >
                        <p
                            data-practice-translation
                            className={
                                mode === 'blocks' && !answerVisible
                                    ? 'break-words text-[24px] font-normal text-practice-text md:text-[32px] design:text-[40px]'
                                    : 'break-words text-[20px] font-medium text-practice-text md:text-[24px] design:text-[30px]'
                            }
                        >
                            {question.translation}
                        </p>
                    </SentenceSlot>
                )}
            {reference.inputLineTop !== null && (
                <SentenceSlot
                    top={reference.inputLineTop}
                    exactLayout={exactLayout}
                    kind="input"
                    offset={-0.5}
                >
                    <div className={exactLayout ? 'design:-translate-y-full' : ''}>
                        <PracticeWordSlotsInput
                            target={question.english}
                            value={session.input}
                            onChange={onInput}
                            phase={session.phase}
                            blocked={blocked}
                            displayFontSize={
                                values.fontSize === '默认' ? undefined : appearance.fontSize
                            }
                            borderStyle={appearance.borderStyle}
                        />
                    </div>
                </SentenceSlot>
            )}
            {reference.revealTop !== null && (
                <SentenceSlot top={reference.revealTop} exactLayout={exactLayout} kind="reveal">
                    <button
                        type="button"
                        disabled={blocked}
                        onClick={onReveal}
                        className="inline-flex h-[58px] w-[186px] cursor-pointer items-center justify-center rounded-lg bg-sentence-reveal p-[10px] text-[18px] font-normal text-practice-text outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        显示答案
                    </button>
                </SentenceSlot>
            )}
            {reference.trayTop !== null && (
                <SentenceSlot top={reference.trayTop} exactLayout={exactLayout} kind="tray">
                    <div
                        aria-label="已选择的词块，点击撤回"
                        className="relative flex min-h-[128px] w-full items-center justify-center rounded-xl px-4 py-6 design:min-h-[163px]"
                    >
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-xl p-px"
                            style={{
                                background: 'var(--app-gradient-sentence-tray)',
                                mask: 'linear-gradient(var(--app-color-text-primary) 0 0) content-box, linear-gradient(var(--app-color-text-primary) 0 0)',
                                maskComposite: 'exclude',
                                WebkitMask:
                                    'linear-gradient(var(--app-color-text-primary) 0 0) content-box, linear-gradient(var(--app-color-text-primary) 0 0)',
                                WebkitMaskComposite: 'xor',
                            }}
                        />
                        {session.blocks.length === 0 ? (
                            <p className="text-caption text-secondary">点击下方词块组成句子</p>
                        ) : (
                            <div className="flex min-w-0 flex-wrap items-center justify-center gap-3 design:translate-y-[0.5px] design:gap-[30px]">
                                {session.blocks.map((id) => {
                                    const token = question.tokens.find((item) => item.id === id)
                                    return token ? (
                                        <SentenceBlock
                                            key={id}
                                            token={token}
                                            values={values}
                                            selected
                                            disabled={blocked}
                                            onBlock={onBlock}
                                        />
                                    ) : null
                                })}
                            </div>
                        )}
                    </div>
                </SentenceSlot>
            )}
            {mode === 'blocks' && (
                <div className="mt-8 flex justify-center design:absolute design:inset-x-0 design:bottom-2">
                    <button
                        data-practice-command="practice.primary"
                        type="button"
                        disabled={blocked}
                        onClick={onReveal}
                        className="cursor-pointer rounded-lg border border-strong px-4 py-2 text-caption text-secondary focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed"
                    >
                        {answerVisible ? '下一题' : '提交作答'}
                    </button>
                </div>
            )}
            {reference.candidatesTop !== null && (
                <SentenceSlot
                    top={reference.candidatesTop}
                    exactLayout={exactLayout}
                    kind="candidates"
                >
                    {candidates.map((token) => (
                        <SentenceBlock
                            key={token.id}
                            token={token}
                            values={values}
                            selected={false}
                            disabled={blocked || session.blocks.includes(token.id)}
                            onBlock={onBlock}
                        />
                    ))}
                </SentenceSlot>
            )}
            {session.phase !== 'answering' && (
                <p
                    role="status"
                    className={
                        exactLayout
                            ? 'mt-8 text-caption text-brand design:absolute design:left-1/2 design:top-[825px] design:mt-0 design:-translate-x-1/2'
                            : 'mt-8 text-caption text-brand'
                    }
                >
                    {session.phase === 'revealed'
                        ? '答案已揭晓（演示，不记为答对）'
                        : session.phase === 'correct'
                          ? '答对状态演示'
                          : '答错状态演示，可继续编辑'}
                </p>
            )}
        </section>
    )
}
