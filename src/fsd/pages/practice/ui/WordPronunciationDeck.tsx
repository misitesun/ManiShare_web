'use client'

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardNavigation, WordPronunciationDeckController } from '../model/word-card-deck'
import { WordPronunciationActions, WordPronunciationCard } from './WordPronunciationCard'
import type { WordPronunciationCardProps } from './WordPronunciationCard'
import CardSwap from './CardSwap'

interface WordPronunciationDeckProps extends WordPronunciationCardProps {
    readonly questions: readonly PracticeQuestion[]
    readonly index: number
    readonly busy: boolean
    readonly blocked: boolean
    readonly isBlocked: () => boolean
    readonly onNavigate: (direction: WordCardNavigation) => void
    readonly onBusyChange: (busy: boolean) => void
    readonly onController: (controller: WordPronunciationDeckController | null) => void
    readonly onDragStart: () => void
    readonly onKnown: () => void
    readonly onRetry: () => void
    readonly remembering: boolean
    readonly onRememberFeedbackComplete: () => void
}

/** 完整待练数据交给引擎；最多四张真实展示卡，回插尾槽与业务题序独立。 */
export function WordPronunciationDeck({
    questions,
    index,
    busy,
    blocked,
    isBlocked,
    onNavigate,
    onBusyChange,
    onController,
    onDragStart,
    onKnown,
    onRetry,
    remembering,
    onRememberFeedbackComplete,
    reading,
    ...face
}: WordPronunciationDeckProps): ReactElement {
    const engine = useRef<WordPronunciationDeckController>(null)
    useEffect(() => {
        onController(engine.current)
        return (): void => onController(null)
    }, [onController])

    return (
        <section
            data-reference-node="546:31237"
            data-word-deck
            aria-label="单词拼读卡堆"
            className="mx-auto w-full max-w-[528px] min-w-0 pr-7 md:max-w-[500px] md:pr-0"
        >
            <p className="sr-only">
                左右滑动均切换下一题；也可使用底部的上一题、下一题按钮和快捷键。
            </p>
            <CardSwap
                ref={engine}
                index={index}
                allowFinish={false}
                blocked={blocked}
                isBlocked={isBlocked}
                onDragStart={onDragStart}
                onBusyChange={onBusyChange}
                onChange={(nextIndex): void => onNavigate(nextIndex > index ? 'next' : 'previous')}
                onFinish={(): void => onNavigate('next')}
            >
                {/* 每张真实卡保持同一描边与轮廓，层次由3D位姿表达，题序变化不切换卡面外观。 */}
                {questions.map((question, questionIndex) => (
                    <WordPronunciationCard
                        key={question.id}
                        {...face}
                        question={question}
                        borderDepth="front"
                        disabled={blocked || remembering || questionIndex !== index}
                        reading={questionIndex === index ? reading : undefined}
                    />
                ))}
            </CardSwap>
            <WordPronunciationActions
                onKnown={onKnown}
                onRetry={onRetry}
                disabled={blocked || busy || remembering}
                remembering={remembering}
                onRememberFeedbackComplete={onRememberFeedbackComplete}
            />
        </section>
    )
}
