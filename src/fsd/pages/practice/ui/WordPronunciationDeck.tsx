'use client'

import { useEffect, useReducer, useRef } from 'react'
import type { ReactElement } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardNavigation, WordPronunciationDeckController } from '../model/word-card-deck'
import { WordPronunciationActions, WordPronunciationCard } from './WordPronunciationCard'
import type { WordPronunciationCardProps } from './WordPronunciationCard'
import { wordCardAnalysisReducer } from '../model/word-card-analysis'
import CardSwap from './CardSwap'

interface WordPronunciationDeckProps extends Omit<
    WordPronunciationCardProps,
    'analysisOpen' | 'onAnalysis' | 'onAnalysisClose'
> {
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
    const currentId = questions[index]?.id ?? null
    const [analysis, dispatchAnalysis] = useReducer(wordCardAnalysisReducer, {
        questionId: currentId,
        open: false,
    })
    // 题目身份变化时同步清掉背面；不重挂物理卡，也不等待 Effect 才显示新题正面。
    if (analysis.questionId !== currentId)
        dispatchAnalysis({ type: 'select', questionId: currentId })
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
                最后一题继续切换下一题时完成本章节，无需全部记住。
            </p>
            <CardSwap
                ref={engine}
                index={index}
                blocked={blocked}
                isBlocked={isBlocked}
                onDragStart={onDragStart}
                onBusyChange={onBusyChange}
                onChange={(nextIndex): void => {
                    dispatchAnalysis({ type: 'close' })
                    onNavigate(nextIndex > index ? 'next' : 'previous')
                }}
                onFinish={(): void => {
                    dispatchAnalysis({ type: 'close' })
                    onNavigate('next')
                }}
            >
                {/* 每张真实卡保持同一描边与轮廓，层次由3D位姿表达，题序变化不切换卡面外观。 */}
                {questions.map((question, questionIndex) => (
                    <WordPronunciationCard
                        key={question.id}
                        {...face}
                        question={question}
                        borderDepth="front"
                        analysisOpen={
                            questionIndex === index &&
                            analysis.questionId === currentId &&
                            analysis.open
                        }
                        onAnalysis={(): void =>
                            dispatchAnalysis({ type: 'open', questionId: question.id })
                        }
                        onAnalysisClose={(): void => dispatchAnalysis({ type: 'close' })}
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
