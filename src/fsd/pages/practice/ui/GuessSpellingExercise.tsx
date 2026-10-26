'use client'

import { useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, RefObject } from 'react'
import type { PracticePhase, PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import type { SentenceAnswerSubmission } from '../model/sentence-answer-input'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    getSentenceAnswerEditingSnapshot,
} from '../model/sentence-answer-input'
import { getPracticeReference } from '../model/reference-layout'
import { SentenceAnswerInput } from './SentenceAnswerInput'
import { TypingKeyboard } from './TypingKeyboard'
import { GuessWordAnswerPanel } from './GuessWordAnswerPanel'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'

interface GuessSpellingStyle extends CSSProperties {
    '--guess-spelling-top': string
    '--guess-spelling-text-gap': string
    '--guess-spelling-keyboard-gap': string
}

interface GuessSpellingExerciseProps {
    readonly question: PracticeQuestion
    readonly phase: PracticePhase
    readonly input: string
    readonly blocked: boolean
    readonly showImage: boolean
    readonly showKeyboard: boolean
    readonly copy: boolean
    readonly ignoreCase: boolean
    readonly borderStyle: 'solid' | 'dashed'
    readonly displayFontSize?: number | undefined
    readonly answerOpen: boolean
    readonly reading?: PracticeReadingView | undefined
    readonly onInput: (value: string) => void
    readonly onSubmit?: ((submission: SentenceAnswerSubmission) => void) | undefined
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
    readonly onCloseAnswer: () => void
    readonly onPlay: () => void
    readonly onExamplePlay: (example: WordCardExample) => void
    readonly onNotice: (message: string) => void
    readonly portalRoot?: RefObject<HTMLElement | null>
}

/** 中文仅作语境；现有句子输入器以一个英文词段作答，键盘不生成文字。 */
export function GuessSpellingExercise({
    question,
    phase,
    input,
    blocked,
    showImage,
    showKeyboard,
    copy,
    ignoreCase,
    borderStyle,
    displayFontSize,
    answerOpen,
    reading,
    onInput,
    onSubmit,
    onController,
    onCloseAnswer,
    onPlay,
    onExamplePlay,
    onNotice,
    portalRoot,
}: GuessSpellingExerciseProps): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const answerId = useId()
    const layout = useMemo(() => createSentenceAnswerLayout(question.english), [question.english])
    const [keyboardInput, setKeyboardInput] = useState(() =>
        getSentenceAnswerEditingSnapshot(layout, createSentenceAnswerState(layout, input)),
    )
    const reference = getPracticeReference('guess', 'spell', phase)
    const editable = phase === 'answering' || phase === 'incorrect'
    const content = question.guess
    const mediaVisible = showImage && content !== undefined
    const style: GuessSpellingStyle = {
        '--guess-spelling-top': `${reference.top}px`,
        '--guess-spelling-text-gap': `${reference.textGap}px`,
        '--guess-spelling-keyboard-gap': `${reference.keyboardGap}px`,
    }

    return (
        <section
            data-guess-spelling-exercise
            data-reference-node={reference.node}
            aria-label="猜词打词模式"
            style={style}
            className="relative w-full min-w-0 shrink-0 px-4 pb-8 pt-16 design:pt-[var(--guess-spelling-top)]"
        >
            {mediaVisible && (
                <div
                    data-practice-reading-surface
                    className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[20px]"
                    style={{ aspectRatio: `${reference.mediaWidth}/${reference.mediaHeight}` }}
                >
                    <img
                        data-practice-media
                        src={content.scene}
                        alt="猜词共用演示场景：两位小朋友在门口打招呼"
                        width={reference.mediaWidth}
                        height={reference.mediaHeight}
                        draggable={false}
                        className="block size-full object-cover"
                    />
                    <PracticeReadingOverlay reading={answerOpen ? undefined : reading} />
                </div>
            )}
            <div
                data-guess-spelling-context
                className={
                    mediaVisible
                        ? 'mx-auto mt-8 flex min-h-12 min-w-0 max-w-[900px] flex-wrap items-center justify-center gap-x-[10px] gap-y-4 text-center text-[20px] font-normal leading-[34px] text-practice-text md:text-[24px] design:mt-[var(--guess-spelling-text-gap)]'
                        : 'mx-auto flex min-h-12 min-w-0 max-w-[900px] flex-wrap items-center justify-center gap-x-[10px] gap-y-4 text-center text-[20px] font-normal leading-[34px] text-practice-text md:text-[24px]'
                }
            >
                <span>{content?.before ?? '请补全这个单词：'}</span>
                <div
                    className={
                        question.english.toLowerCase() === 'hand'
                            ? 'min-w-0 max-w-full [&_[data-sentence-word-hint]]:blur-[3px] design:[&_[data-sentence-answer-slot]]:min-w-[114px]'
                            : 'min-w-0 max-w-full [&_[data-sentence-word-hint]]:blur-[3px]'
                    }
                >
                    <SentenceAnswerInput
                        key={editable ? 'editable' : 'result'}
                        label="单词答案"
                        target={question.english}
                        initialValue={editable ? input : question.english}
                        phase={phase}
                        blocked={blocked || !editable}
                        showWordHint={copy || !editable}
                        ignoreCase={ignoreCase}
                        referenceLayout={false}
                        borderStyle={borderStyle}
                        displayFontSize={displayFontSize}
                        inputRef={inputRef}
                        onChange={onInput}
                        onSubmit={onSubmit}
                        onController={onController}
                        onEditingChange={setKeyboardInput}
                    />
                </div>
                {content?.after && <span>{content.after}</span>}
            </div>
            <div
                hidden={!showKeyboard}
                data-guess-keyboard
                className="mt-[var(--guess-spelling-keyboard-gap)] min-w-0"
            >
                <TypingKeyboard
                    width={reference.keyboardWidth}
                    height={reference.keyboardHeight}
                    inputRef={inputRef}
                    targetText={copy ? keyboardInput.target : undefined}
                    input={keyboardInput.value}
                    cursor={keyboardInput.cursor}
                    active={!blocked && !answerOpen && editable && showKeyboard}
                    sessionKey={`${question.id}:${keyboardInput.slotId}`}
                />
            </div>
            <GuessWordAnswerPanel
                id={answerId}
                open={answerOpen}
                blocked={blocked}
                anchor={inputRef}
                question={question}
                reading={reading}
                onClose={onCloseAnswer}
                onPlay={onPlay}
                onExamplePlay={onExamplePlay}
                onNotice={onNotice}
                {...(portalRoot ? { portalRoot } : {})}
            />
        </section>
    )
}
