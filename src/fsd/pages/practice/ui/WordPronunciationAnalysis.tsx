import type { ReactElement } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample, WordExamplePart } from '../model/word-card-analysis'
import { formatWordPhonetic } from '../model/word-phonetics'
import { getWordCardOutlineRadius } from '../model/word-card-outline'
import { WordDictionaryLink } from './WordDictionaryLink'

interface WordPronunciationAnalysisProps {
    readonly question: PracticeQuestion
    readonly disabled: boolean
    readonly borderDepth: 'front' | 'near' | 'far'
    readonly onBack: () => void
    readonly onExamplePlay: (example: WordCardExample) => void
}

function ExampleText({ parts }: { readonly parts: readonly WordExamplePart[] }): ReactElement {
    return (
        <>
            {parts.map((part, index) => (
                <span
                    key={index}
                    data-word-example-highlight={part.highlighted || undefined}
                    className={part.highlighted ? 'text-accent-blue' : ''}
                >
                    {part.text}
                </span>
            ))}
        </>
    )
}

function HeadsetIcon(): ReactElement {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 size-5 shrink-0">
            <path
                d="M4 14v-3a8 8 0 0 1 16 0v3M4 13h2v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Zm16 0h-2v8h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/** 词卡背面仅消费当前题数据；不复用含请求的词典弹窗或自动补句。 */
export function WordPronunciationAnalysis({
    question,
    disabled,
    borderDepth,
    onBack,
    onExamplePlay,
}: WordPronunciationAnalysisProps): ReactElement {
    const examples = question.wordExamples ?? []
    return (
        <section
            data-word-analysis
            aria-label={`${question.english} 的单词解析`}
            style={{ borderRadius: getWordCardOutlineRadius(borderDepth) }}
            className="relative flex h-full min-h-0 w-full flex-col overflow-hidden border border-brand-start bg-practice-card text-foreground"
        >
            <button
                data-word-analysis-return
                type="button"
                disabled={disabled}
                aria-label="返回单词正面"
                onClick={onBack}
                className="absolute left-3 top-3 z-[1] flex size-10 cursor-pointer items-center justify-center rounded-lg text-practice-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default md:size-8"
            >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-6">
                    <path
                        d="m10 4-8 7 8 7v-5h3c4 0 7 2 9 6-1-8-4-11-12-11V4Z"
                        fill="currentColor"
                    />
                </svg>
            </button>
            <div
                data-word-analysis-scroll
                tabIndex={disabled ? -1 : 0}
                aria-label="单词释义和双语例句，可滚动"
                onPointerDownCapture={(event): void => {
                    // 背面触屏手势留给例句滚动，不让卡堆捕获同一指针。
                    if (event.pointerType === 'touch') event.stopPropagation()
                }}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-12 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus md:px-7 md:pt-10"
            >
                <div className="flex min-w-0 items-center justify-center gap-3 pl-8">
                    <h2
                        data-word-analysis-heading
                        className="m-0 min-w-0 break-words text-center text-[32px] font-normal leading-[1.2] md:text-[38px]"
                    >
                        {question.english}
                    </h2>
                    <WordDictionaryLink
                        word={question.english}
                        disabled={disabled}
                        appearance="analysis"
                    >
                        <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="size-7">
                            <path
                                d="M14 24H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h15a3 3 0 0 1 3 3v9"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                            <path d="m13 11 13 7-6 2-2 6-5-15Z" fill="currentColor" />
                        </svg>
                    </WordDictionaryLink>
                </div>
                <p className="m-0 mt-3 break-words text-center text-[16px] leading-6 text-practice-muted">
                    {formatWordPhonetic(question.phonetic)}
                </p>
                <p className="m-0 mt-4 break-words text-center text-[16px] leading-6">
                    {question.translation}
                </p>
                {examples.length > 0 ? (
                    <ul aria-label="双语例句" className="m-0 mt-9 grid list-none gap-5 p-0">
                        {examples.map((example) => (
                            <li key={example.id} data-word-analysis-example>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    aria-label={`朗读例句：${example.english.map((part) => part.text).join('')}`}
                                    onClick={(): void => onExamplePlay(example)}
                                    className="flex min-h-10 w-full min-w-0 cursor-pointer items-start gap-2 rounded-md text-left text-[16px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                                >
                                    <HeadsetIcon />
                                    <span className="min-w-0 flex-1 break-words">
                                        <span className="block font-semibold">
                                            <ExampleText parts={example.english} />
                                        </span>
                                        <span className="mt-1 block font-normal">
                                            <ExampleText parts={example.translation} />
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="m-0 mt-9 text-center text-[16px] leading-6 text-practice-muted">
                        当前单词暂无例句。
                    </p>
                )}
            </div>
        </section>
    )
}
