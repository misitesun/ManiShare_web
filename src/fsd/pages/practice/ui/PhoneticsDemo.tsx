'use client'

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import type { OralAssessmentDemoController } from '../../../features/oral-assessment'
import { describePhoneticsReadingPlan } from '../model/phonetics-reading-plan'
import type { PracticeQuestion } from '../model/practice-demo'
import type { PhoneticsLesson } from '../model/phonetics-lesson'
import type { PhoneticsReadingSnapshot } from '../model/phonetics-reading-runtime'
import type { WordCardNavigation, WordPronunciationDeckController } from '../model/word-card-deck'
import soundPlay from '../assets/phonetics-sound-play.svg'
import CardSwap from './CardSwap'
import { PhoneticsWordCard } from './PhoneticsWordCard'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { getPhoneticsReadingView } from './phonetics-reading-view'

interface PhoneticsDemoProps {
    readonly questions: readonly PracticeQuestion[]
    readonly index: number
    readonly blocked: boolean
    readonly isBlocked: () => boolean
    readonly onController: (controller: WordPronunciationDeckController | null) => void
    readonly onBusyChange: (busy: boolean) => void
    readonly onNavigate: (direction: WordCardNavigation) => void
    readonly onDragStart: () => void
    readonly onNotice: (message: string) => void
    readonly naturalPhonics?: boolean
    readonly reading?: PhoneticsReadingSnapshot | undefined
    readonly waveStyle?: string
    readonly onWordRead?: (() => void) | undefined
    readonly onSegmentRead?: ((segmentId: string) => void) | undefined
    readonly oralController?: OralAssessmentDemoController | undefined
    readonly oralEnabled?: boolean
    readonly recordingWave?: string
}

/** 与当前词卡独立的课程讲解；上下键只改变其可见性。 */
export function PhoneticsExplanation({
    lesson,
    blocked = false,
    onPlay,
    reading,
}: {
    readonly lesson?: PhoneticsLesson | undefined
    readonly blocked?: boolean
    readonly onPlay?: (() => void) | undefined
    readonly reading?: PracticeReadingView | undefined
}): ReactElement {
    const target = lesson?.targetPhonetic ?? 'ʌ'
    return (
        <div className="relative grid min-w-0 gap-6 rounded-[16px] bg-surface-raised/70 p-4 ring-1 ring-inset ring-practice-control-text/30 md:grid-cols-2 design:block design:h-[180px] design:p-0">
            <div className="flex flex-col items-center design:contents">
                <h2 className="m-0 text-[14px] font-medium leading-[20px] tracking-[0.0143em] text-practice-control-text design:absolute design:left-[96px] design:top-[11px]">
                    {lesson?.title ?? '前元音'}
                </h2>
                <div
                    data-practice-reading-surface
                    className="relative mt-2 h-[74px] w-[143px] overflow-hidden rounded-lg bg-surface-raised ring-1 ring-inset ring-practice-control-text/30 design:absolute design:left-[46px] design:top-[41px] design:mt-0"
                >
                    <p className="absolute left-[43px] top-0 m-0 text-[38px] font-normal leading-[60px] tracking-[0.0069em] text-practice-control-text/50">
                        /<span className="text-phonetics-error">{target}</span>/
                    </p>
                    <PracticeReadingOverlay reading={blocked ? undefined : reading} compact />
                    <button
                        type="button"
                        disabled={blocked || !onPlay}
                        aria-label={`播放目标音标 /${target}/`}
                        onClick={onPlay}
                        className="absolute left-[108px] top-[39px] z-20 flex size-10 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:opacity-50"
                    >
                        <img
                            src={soundPlay.src}
                            width={20}
                            height={20}
                            alt=""
                            className="block shrink-0"
                        />
                    </button>
                </div>
                <p className="m-0 mt-3 text-[14px] font-normal text-practice-control-text design:absolute design:left-[91px] design:top-[125px] design:mt-0">
                    记忆口诀
                </p>
                <p className="m-0 mt-1 text-center text-[14px] font-normal leading-5 text-practice-muted design:absolute design:left-[53px] design:top-[150px] design:mt-0 design:w-[140px]">
                    {lesson?.mnemonic ?? '保持较近且持续的音质'}
                </p>
            </div>
            <div className="flex h-[130px] w-full max-w-[270px] items-center justify-center justify-self-center rounded-lg bg-phonetics-placeholder text-[14px] font-normal text-media-ink design:absolute design:left-[370px] design:top-[25px] design:w-[270px]">
                图片/视频 16:9
            </div>
            {lesson && (
                <ol className="sr-only" aria-label="发音要点">
                    {lesson.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                    ))}
                </ol>
            )}
        </div>
    )
}

/** 为固定讲解预留实际高度与90px间距；原稿主卡y481，切题不重挂整个卡堆。 */
export function PhoneticsDemo({
    questions,
    index,
    blocked,
    isBlocked,
    onController,
    onBusyChange,
    onNavigate,
    onDragStart,
    onNotice,
    naturalPhonics = true,
    reading,
    waveStyle = '默认竖条',
    onWordRead,
    onSegmentRead,
    oralController,
    oralEnabled = true,
    recordingWave = '默认竖条',
}: PhoneticsDemoProps): ReactElement {
    const engine = useRef<WordPronunciationDeckController>(null)
    const wordReading = blocked ? undefined : getPhoneticsReadingView(reading, 'word', waveStyle)
    useEffect(() => {
        onController(engine.current)
        return (): void => onController(null)
    }, [onController])

    return (
        <section
            data-reference-node="546:41805"
            data-phonetics-deck
            aria-label="音标练习示例"
            className="relative z-0 px-4 pb-8 pt-[calc(var(--practice-phonetics-panel-height,346px)+111px)] md:pt-[calc(var(--practice-phonetics-panel-height,192px)+111px)] design:px-0 design:pt-[calc(var(--practice-phonetics-panel-height,180px)+226px)]"
        >
            <div className="relative mx-auto w-full max-w-[720px] min-w-0">
                <div className="relative isolate w-full max-w-[708px] pr-7 md:max-w-[680px] md:pr-0">
                    <p className="sr-only">
                        向任意方向滑动均切换下一题；也可使用底部的上一题、下一题按钮和切题快捷键。
                        最后一题继续切换下一题时完成本章节。
                    </p>
                    <CardSwap
                        ref={engine}
                        label="音标词卡堆"
                        scaleHorizontalSpacing
                        index={index}
                        blocked={blocked}
                        isBlocked={isBlocked}
                        onDragStart={onDragStart}
                        onBusyChange={onBusyChange}
                        onChange={(nextIndex): void =>
                            onNavigate(nextIndex > index ? 'next' : 'previous')
                        }
                        onFinish={(): void => onNavigate('next')}
                    >
                        {questions.map((question, questionIndex) => (
                            <PhoneticsWordCard
                                key={question.id}
                                question={question}
                                disabled={blocked || questionIndex !== index}
                                activeStep={questionIndex === index ? reading?.step : null}
                                reading={questionIndex === index ? wordReading : undefined}
                                onPlay={(): void => {
                                    if (onWordRead) onWordRead()
                                    else onNotice('当前词例的朗读控制器尚未就绪。')
                                }}
                                onSegmentPlay={(segmentId): void => {
                                    if (onSegmentRead) onSegmentRead(segmentId)
                                    else onNotice('当前词例的朗读控制器尚未就绪。')
                                }}
                                oralController={
                                    questionIndex === index ? oralController : undefined
                                }
                                oralEnabled={oralEnabled}
                                recordingWave={recordingWave}
                                readingWave={waveStyle}
                            />
                        ))}
                    </CardSwap>
                </div>
            </div>
            <p
                data-phonetics-reading-plan={naturalPhonics ? 'phonics' : 'basic'}
                className="sr-only"
            >
                朗读顺序：{describePhoneticsReadingPlan(naturalPhonics)}
            </p>
            <p
                role="status"
                aria-live="polite"
                className={
                    reading?.error
                        ? 'mx-auto mt-4 max-w-[720px] text-center text-caption text-secondary'
                        : 'sr-only'
                }
            >
                {reading?.error ??
                    (reading?.playRequested
                        ? `正在朗读：${reading.step?.label ?? '准备播放'}`
                        : reading?.status === 'ended'
                          ? '本词朗读完成，可重播或切换下一词。'
                          : '点击播放或按朗读快捷键，播放当前词例。')}
            </p>
        </section>
    )
}
