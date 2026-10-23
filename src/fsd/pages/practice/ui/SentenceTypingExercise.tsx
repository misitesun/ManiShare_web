'use client'

import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { getSentenceGameLabel } from '../model/sentence-game-family'
import type { SentenceGameFamily } from '../model/sentence-game-family'
import type { PracticePhase, PracticeQuestion } from '../model/practice-demo'
import { getPracticeReference } from '../model/reference-layout'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    getSentenceAnswerEditingSnapshot,
} from '../model/sentence-answer-input'
import type { SentenceAnswerSubmission } from '../model/sentence-answer-input'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import scene from '../assets/reading-scene.png'
import { SentenceAnswerInput } from './SentenceAnswerInput'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { TypingKeyboard } from './TypingKeyboard'
import { WordCardHeading } from './WordCardHeading'

interface SentenceTypingStyle extends CSSProperties {
    '--sentence-typing-top': string
    '--sentence-typing-text-gap': string
    '--sentence-typing-translation-gap': string
    '--sentence-typing-keyboard-gap': string
}

interface SentenceTypingExerciseProps {
    readonly family?: SentenceGameFamily | 'video'
    readonly media?: ReactNode
    readonly question: PracticeQuestion
    readonly phase: PracticePhase
    readonly input: string
    readonly blocked: boolean
    readonly imageVisible: boolean
    readonly translationVisible: boolean
    readonly copy: boolean
    readonly ignoreCase: boolean
    readonly borderStyle: 'solid' | 'dashed'
    readonly displayFontSize?: number | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly onInput: (value: string) => void
    readonly onPlay: () => void
    readonly onSubmit?: ((submission: SentenceAnswerSubmission) => void) | undefined
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
}

/** 沿用单词指法布局与只读键盘，作答由中译英同一多段输入器持有。 */
export function SentenceTypingExercise({
    family = 'sentence',
    media,
    question,
    phase,
    input,
    blocked,
    imageVisible,
    translationVisible,
    copy,
    ignoreCase,
    borderStyle,
    displayFontSize,
    reading,
    onInput,
    onPlay,
    onSubmit,
    onController,
}: SentenceTypingExerciseProps): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const layout = useMemo(() => createSentenceAnswerLayout(question.english), [question.english])
    const [keyboardInput, setKeyboardInput] = useState(() =>
        getSentenceAnswerEditingSnapshot(layout, createSentenceAnswerState(layout, input)),
    )
    const reference = getPracticeReference(family === 'video' ? 'video' : 'word', 'typing', phase)
    const mediaVisible = media !== undefined || imageVisible
    const editable = phase === 'answering' || phase === 'incorrect'
    const style: SentenceTypingStyle = {
        '--sentence-typing-top': `${reference.top}px`,
        '--sentence-typing-text-gap': `${reference.textGap}px`,
        '--sentence-typing-translation-gap': `${reference.translationGap}px`,
        '--sentence-typing-keyboard-gap': `${reference.keyboardGap}px`,
    }
    return (
        <article
            data-practice-typing-family={family}
            data-audio-typing-exercise={family === 'audio' || undefined}
            data-video-typing-exercise={family === 'video' || undefined}
            data-sentence-typing-exercise
            data-reference-layout={family === 'video' ? 'video:typing' : 'word:typing'}
            style={style}
            className="relative w-full min-w-0 shrink-0 px-4 pt-16 design:pt-[var(--sentence-typing-top)]"
        >
            {media !== undefined ? (
                <div className="mx-auto flex w-full max-w-[600px] justify-center">{media}</div>
            ) : imageVisible ? (
                <div
                    data-practice-reading-surface
                    className="relative mx-auto aspect-video w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={scene.src}
                        alt={`${getSentenceGameLabel(family)}练习共用示意插图`}
                        width={reference.mediaWidth}
                        height={reference.mediaHeight}
                        className="absolute inset-0 block h-full w-full object-cover"
                    />
                    <PracticeReadingOverlay reading={reading} />
                </div>
            ) : null}
            <div
                data-sentence-typing-answer
                style={displayFontSize === undefined ? undefined : { fontSize: displayFontSize }}
                className={
                    mediaVisible
                        ? 'mx-auto mt-[var(--sentence-typing-text-gap)] flex min-h-[56px] w-full max-w-[848px] min-w-0 items-center justify-center text-[28px] font-medium leading-none tracking-[0.06em] md:text-[34px] design:text-[40px] [&_[data-sentence-word-hint]]:blur-[3px]'
                        : 'mx-auto flex min-h-[56px] w-full max-w-[848px] min-w-0 items-center justify-center text-[28px] font-medium leading-none tracking-[0.06em] md:text-[34px] design:text-[40px] [&_[data-sentence-word-hint]]:blur-[3px]'
                }
            >
                {phase === 'correct' ? (
                    <WordCardHeading
                        word={question.english}
                        referenceLayout={false}
                        placement="typing"
                        playLabel="朗读当前句子"
                        displayFontSize={displayFontSize}
                        disabled={blocked}
                        onPlay={onPlay}
                    />
                ) : (
                    <SentenceAnswerInput
                        key={editable ? 'editable' : 'result'}
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
                )}
            </div>
            <p
                data-sentence-typing-translation
                aria-hidden={!translationVisible}
                className="mx-auto mt-[var(--sentence-typing-translation-gap)] min-h-[34px] max-w-[848px] break-words text-center text-[18px] font-medium leading-[normal] text-practice-muted md:text-[24px]"
            >
                {translationVisible && question.translation}
            </p>
            <div className="mt-[var(--sentence-typing-keyboard-gap)] min-w-0">
                <TypingKeyboard
                    width={reference.keyboardWidth}
                    height={reference.keyboardHeight}
                    inputRef={inputRef}
                    targetText={keyboardInput.target}
                    input={keyboardInput.value}
                    cursor={keyboardInput.cursor}
                    active={!blocked && editable}
                    sessionKey={`${question.id}:${keyboardInput.slotId}`}
                />
            </div>
        </article>
    )
}
