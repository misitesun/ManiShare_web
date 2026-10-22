'use client'

import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import type { PracticePhase, PracticeQuestion } from '../model/practice-demo'
import { getPracticeReference } from '../model/reference-layout'
import { createWordSpellingLayout } from '../model/word-spelling-input'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import wordAsset from '../assets/word-woman-e23d5f.png'
import { PracticeAnswerInput } from './PracticeAnswerInput'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { TypingKeyboard } from './TypingKeyboard'
import { WordCardHeading } from './WordCardHeading'

interface WordTypingStyle extends CSSProperties {
    '--word-typing-top': string
    '--word-typing-text-gap': string
    '--word-typing-translation-gap': string
    '--word-typing-keyboard-gap': string
}

interface WordTypingExerciseProps {
    readonly question: PracticeQuestion
    readonly phase: PracticePhase
    readonly input: string
    readonly blocked: boolean
    readonly imageVisible: boolean
    readonly translationVisible: boolean
    readonly copy: boolean
    readonly ignoreCase: boolean
    readonly displayFontSize?: number | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly onInput: (value: string) => void
    readonly onPlay: () => void
    readonly onSubmit?: ((value: string) => void) | undefined
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
}

/** 指法只组合共用输入器与只读键盘；两者消费同一输入桥和逻辑光标。 */
export function WordTypingExercise({
    question,
    phase,
    input,
    blocked,
    imageVisible,
    translationVisible,
    copy,
    ignoreCase,
    displayFontSize,
    reading,
    onInput,
    onPlay,
    onSubmit,
    onController,
}: WordTypingExerciseProps): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const [cursor, setCursor] = useState(0)
    const layout = useMemo(
        () => createWordSpellingLayout(question.english, 'syllables'),
        [question.english],
    )
    const reference = getPracticeReference('word', 'typing', phase)
    const editable = phase === 'answering' || phase === 'incorrect'
    const style: WordTypingStyle = {
        '--word-typing-top': `${reference.top}px`,
        '--word-typing-text-gap': `${reference.textGap}px`,
        '--word-typing-translation-gap': `${reference.translationGap}px`,
        '--word-typing-keyboard-gap': `${reference.keyboardGap}px`,
    }
    const inputStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }

    return (
        <article
            data-word-typing-exercise
            data-reference-node={reference.node}
            style={style}
            className="relative w-full min-w-0 shrink-0 px-4 pt-16 design:pt-[var(--word-typing-top)]"
        >
            {imageVisible && (
                <div
                    data-practice-reading-surface
                    className="relative mx-auto aspect-video w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={wordAsset.src}
                        alt="单词练习示意图：女人在公园散步"
                        width={reference.mediaWidth}
                        height={reference.mediaHeight}
                        className="absolute inset-0 block h-full w-full object-cover"
                    />
                    <PracticeReadingOverlay reading={reading} />
                </div>
            )}
            <div
                data-word-typing-answer
                style={inputStyle}
                className={
                    imageVisible
                        ? 'mx-auto mt-[var(--word-typing-text-gap)] flex min-h-[56px] w-full max-w-[848px] min-w-0 items-center justify-center text-[28px] font-medium leading-none tracking-[0.06em] md:text-[34px] design:text-[40px] [&_[data-spelling-letter=empty]]:blur-[3px]'
                        : 'mx-auto flex min-h-[56px] w-full max-w-[848px] min-w-0 items-center justify-center text-[28px] font-medium leading-none tracking-[0.06em] md:text-[34px] design:text-[40px] [&_[data-spelling-letter=empty]]:blur-[3px]'
                }
            >
                {phase === 'correct' ? (
                    <WordCardHeading
                        word={question.english}
                        referenceLayout={false}
                        placement="typing"
                        displayFontSize={displayFontSize}
                        disabled={blocked}
                        onPlay={onPlay}
                    />
                ) : (
                    <PracticeAnswerInput
                        key={editable ? 'editable' : 'result'}
                        layout={layout}
                        initialValue={editable ? input : question.english}
                        blocked={blocked || !editable}
                        ignoreCase={ignoreCase}
                        showWordHint={copy || !editable}
                        presentation="typing"
                        displayFontSize={displayFontSize}
                        inputRef={inputRef}
                        label="指法练习单词"
                        onChange={onInput}
                        onSubmit={onSubmit}
                        onController={onController}
                        onCursorChange={setCursor}
                    />
                )}
            </div>
            <p
                data-word-typing-translation
                aria-hidden={!translationVisible}
                className="mx-auto mt-[var(--word-typing-translation-gap)] min-h-[34px] max-w-[848px] break-words text-center text-[18px] font-medium leading-[normal] text-practice-muted md:text-[24px]"
            >
                {translationVisible && question.translation}
            </p>
            <div className="mt-[var(--word-typing-keyboard-gap)] min-w-0">
                <TypingKeyboard
                    width={reference.keyboardWidth}
                    height={reference.keyboardHeight}
                    inputRef={inputRef}
                    targetText={question.english}
                    input={input}
                    cursor={cursor}
                    active={!blocked && editable}
                    sessionKey={question.id}
                />
            </div>
        </article>
    )
}
