'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { getSentenceGameLabel } from '../model/sentence-game-family'
import type { SentenceGameFamily } from '../model/sentence-game-family'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion, PracticeSession, PracticeToken } from '../model/practice-demo'
import { getSentenceExerciseReference, type SentenceExerciseMode } from '../model/reference-layout'
import { isPracticeAnswerVisible } from '../model/practice-visibility'
import { AnnotatedText } from './AnnotatedText'
import sentenceAsset from '../assets/reading-scene.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import { SentenceAnswerInput } from './SentenceAnswerInput'
import type { SentenceAnswerSubmission } from '../model/sentence-answer-input'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import type { WordSpellingInputController } from '../model/word-spelling-input'

interface SlotStyle extends CSSProperties {
    '--sentence-slot-top': string
    '--sentence-flow-gap': string
    '--sentence-slot-offset': string
}

interface BlockStyle extends CSSProperties {
    '--sentence-block-width'?: string
}

export interface SentenceExerciseProps {
    readonly family?: SentenceGameFamily
    readonly question: PracticeQuestion
    readonly mode: SentenceExerciseMode
    readonly session: PracticeSession
    readonly values: LearningPreferences
    readonly imageVisible: boolean
    readonly showWordHint?: boolean | undefined
    readonly translationVisible?: boolean | undefined
    readonly blocked: boolean
    readonly onInput: (value: string) => void
    readonly onNavigate?: (() => void) | undefined
    readonly onSentenceSubmit?: ((submission: SentenceAnswerSubmission) => void) | undefined
    readonly onAnswerController?:
        ((controller: WordSpellingInputController | null) => void) | undefined
    readonly onBlock: (id: string) => void
    readonly onReveal: () => void
    readonly reading?: PracticeReadingView | undefined
}

interface SentenceSlotProps {
    readonly top: number
    readonly exactLayout: boolean
    readonly kind: 'media' | 'english' | 'translation' | 'reveal' | 'tray' | 'candidates'
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
        '--sentence-flow-gap': kind === 'media' ? '0px' : '32px',
        '--sentence-slot-offset': exactLayout ? `${offset}px` : '0px',
    }
    const innerClassName =
        kind === 'media'
            ? 'w-full max-w-[430px] design:translate-x-[var(--sentence-slot-offset)]'
            : kind === 'english' || kind === 'translation'
              ? 'w-full max-w-[900px] text-center design:translate-x-[var(--sentence-slot-offset)]'
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

interface SentenceTranslationExerciseProps extends Pick<
    SentenceExerciseProps,
    | 'family'
    | 'question'
    | 'session'
    | 'values'
    | 'imageVisible'
    | 'showWordHint'
    | 'translationVisible'
    | 'blocked'
    | 'onInput'
    | 'onNavigate'
    | 'onSentenceSubmit'
    | 'onAnswerController'
    | 'reading'
> {
    readonly exactLayout: boolean
}

/** 中译英使用自然流：基准尺寸保持原稿位置，长词/多行向下撑开，避免反向覆盖中文。 */
function SentenceTranslationExercise({
    family = 'sentence',
    question,
    session,
    values,
    imageVisible,
    showWordHint,
    translationVisible,
    blocked,
    onInput,
    onNavigate,
    onSentenceSubmit,
    onAnswerController,
    reading,
    exactLayout,
}: SentenceTranslationExerciseProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    return (
        <section
            aria-label={`${getSentenceGameLabel(family)}练习`}
            data-practice-sentence-family={family}
            data-reference-node="546:33717"
            className={
                exactLayout
                    ? 'relative mx-auto flex min-w-0 flex-col items-center px-4 pb-12 pt-16 md:px-6 design:min-h-[calc(100svh-175px)] design:pt-[261px]'
                    : 'relative mx-auto flex min-w-0 flex-col items-center px-4 pb-12 pt-16 md:px-6'
            }
        >
            {imageVisible && (
                <div className="w-full max-w-[430px]">
                    <div
                        data-practice-reading-surface
                        className="relative overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={sentenceAsset.src}
                            alt={`${getSentenceGameLabel(family)}练习示例插图`}
                            className="block h-auto w-full rounded-[20px] object-cover"
                            style={{ aspectRatio: '430 / 242' }}
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                </div>
            )}
            {(translationVisible ?? true) && (
                <p
                    data-practice-translation
                    className={
                        exactLayout
                            ? 'mt-6 max-w-full break-words text-center text-[20px] font-medium leading-7 text-practice-text md:text-[24px] md:leading-[34px] design:relative design:-left-[14px] design:text-[30px] design:leading-[42px]'
                            : 'mt-6 max-w-full break-words text-center text-[20px] font-medium leading-7 text-practice-text md:text-[24px] md:leading-[34px] design:text-[30px] design:leading-[42px]'
                    }
                >
                    {question.translation}
                </p>
            )}
            <div
                className={
                    exactLayout
                        ? 'mt-10 w-full min-w-0 max-w-[900px] design:relative design:-left-[0.5px] design:mt-[31px]'
                        : 'mt-10 w-full min-w-0 max-w-[900px]'
                }
            >
                <SentenceAnswerInput
                    target={question.english}
                    initialValue={session.input}
                    showWordHint={showWordHint ?? true}
                    onChange={onInput}
                    onNavigate={onNavigate}
                    onSubmit={onSentenceSubmit}
                    onController={onAnswerController}
                    ignoreCase={values.ignoreCase}
                    phase={session.phase}
                    blocked={blocked}
                    referenceLayout={exactLayout}
                    displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                    borderStyle={appearance.borderStyle}
                />
            </div>
        </section>
    )
}

type SentenceCheckExerciseProps = Pick<
    SentenceExerciseProps,
    'family' | 'question' | 'values' | 'imageVisible' | 'blocked' | 'onReveal' | 'reading'
>

/** 自查题面自然向下排布；揭晓后由PracticeContent复用完整听力题面。 */
function SentenceCheckExercise({
    family = 'sentence',
    question,
    values,
    imageVisible,
    blocked,
    onReveal,
    reading,
}: SentenceCheckExerciseProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    const referenceLayout = imageVisible && values.fontSize === '默认'
    const words = question.english.trim().split(/\s+/)
    return (
        <section
            aria-label={`${getSentenceGameLabel(family)}理解自查`}
            data-practice-check-family={family}
            data-sentence-check-prompt
            data-reference-node="546:33970"
            className={
                referenceLayout
                    ? 'relative mx-auto flex w-full min-w-0 flex-1 flex-col items-center px-4 pb-12 pt-16 md:px-6 design:min-h-[calc(100svh-175px)] design:pt-[170px]'
                    : 'relative mx-auto flex w-full min-w-0 flex-1 flex-col items-center px-4 pb-12 pt-16 md:px-6'
            }
        >
            {imageVisible && (
                <div
                    data-practice-reading-surface
                    className="relative w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={sentenceAsset.src}
                        alt={`${getSentenceGameLabel(family)}练习共用示意插图`}
                        width={430}
                        height={242}
                        className="block aspect-[430/242] h-auto w-full object-cover"
                    />
                    <PracticeReadingOverlay reading={reading} />
                </div>
            )}
            <p
                data-practice-english
                data-sentence-check-english
                style={
                    values.fontSize === '默认'
                        ? undefined
                        : { fontSize: appearance.fontSize, lineHeight: 1.4 }
                }
                className={
                    imageVisible
                        ? 'mt-8 flex max-w-[900px] flex-wrap justify-center gap-x-4 gap-y-2 break-words text-center text-[28px] font-medium leading-[1.4] text-practice-answer md:mt-10 md:gap-x-5 md:text-[34px] design:mt-[45px] design:gap-x-[24px] design:text-[40px] design:leading-[56px]'
                        : 'flex max-w-[900px] flex-wrap justify-center gap-x-4 gap-y-2 break-words text-center text-[28px] font-medium leading-[1.4] text-practice-answer md:gap-x-5 md:text-[34px] design:gap-x-[24px] design:text-[40px] design:leading-[56px]'
                }
            >
                {words.map((word, index) => (
                    <Fragment key={`${question.id}:${index}`}>
                        {index > 0 ? ' ' : null}
                        <span className="min-w-0 max-w-full">
                            {index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word}
                        </span>
                    </Fragment>
                ))}
            </p>
            <button
                type="button"
                data-sentence-check-reveal
                disabled={blocked}
                onClick={onReveal}
                className="mt-8 inline-flex h-[58px] w-[186px] max-w-full shrink-0 cursor-pointer items-center justify-center rounded-lg bg-sentence-reveal p-[10px] text-[18px] font-normal leading-[25px] text-practice-text outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40 design:mt-[47px]"
            >
                空格显示答案
            </button>
        </section>
    )
}

export function SentenceExercise({
    family = 'sentence',
    question,
    mode,
    session,
    values,
    imageVisible,
    showWordHint,
    translationVisible,
    blocked,
    onInput,
    onNavigate,
    onSentenceSubmit,
    onAnswerController,
    onBlock,
    onReveal,
    reading,
}: SentenceExerciseProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    const reference = getSentenceExerciseReference(mode, session.phase)
    const answerVisible = isPracticeAnswerVisible(session.phase)
    const exactLayout =
        imageVisible && values.fontSize === '默认' && values.grammarFontSize === '默认'
    if (mode === 'check' && !answerVisible)
        return (
            <SentenceCheckExercise
                family={family}
                question={question}
                values={values}
                imageVisible={imageVisible}
                blocked={blocked}
                onReveal={onReveal}
                reading={reading}
            />
        )
    if (mode === 'translate' && !answerVisible)
        return (
            <SentenceTranslationExercise
                family={family}
                question={question}
                session={session}
                values={values}
                imageVisible={imageVisible}
                showWordHint={showWordHint}
                translationVisible={translationVisible}
                blocked={blocked}
                onInput={onInput}
                onNavigate={onNavigate}
                onSentenceSubmit={onSentenceSubmit}
                onAnswerController={onAnswerController}
                reading={reading}
                exactLayout={exactLayout}
            />
        )
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
            aria-label={`${getSentenceGameLabel(family)}练习`}
            data-practice-sentence-family={family}
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
                            alt={`${getSentenceGameLabel(family)}练习示例插图`}
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
