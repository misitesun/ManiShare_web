import type { ReactElement } from 'react'
import type { OralAssessmentDemoController } from '../../../features/oral-assessment'
import type { PracticeQuestion } from '../model/practice-demo'
import type { PhoneticsAudioStep } from '../model/phonetics-reading-plan'
import phoneticsWord from '../assets/phonetics-word.png'
import wordPlay from '../assets/phonetics-word-play.svg'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { PhoneticsOralControls } from './PhoneticsOralControls'

interface PhoneticsWordCardProps {
    readonly question: PracticeQuestion
    readonly disabled: boolean
    readonly activeStep?: PhoneticsAudioStep | null | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly onPlay: () => void
    readonly onSegmentPlay: (segmentId: string) => void
    readonly oralController?: OralAssessmentDemoController | undefined
    readonly oralEnabled?: boolean
    readonly recordingWave?: string
    readonly readingWave?: string
}

/** 546:41846：680×360词卡；文字消费当前词例，插图沿原稿共用演示资源。 */
export function PhoneticsWordCard({
    question,
    disabled,
    activeStep,
    reading,
    onPlay,
    onSegmentPlay,
    oralController,
    oralEnabled = true,
    recordingWave = '默认竖条',
    readingWave = '默认竖条',
}: PhoneticsWordCardProps): ReactElement {
    const content = question.phonetics
    const playbackDisabled =
        disabled || oralController?.stage === 'recording' || oralController?.stage === 'evaluating'
    return (
        <article
            data-phonetics-card
            data-phonetics-question-id={question.id}
            aria-label={`${question.english} 音标词卡`}
            className="relative min-w-0 rounded-[24px] bg-[image:var(--app-gradient-sentence-tray)] p-px shadow-[var(--app-shadow-phonetics-card)] [[data-swap-index]:not([data-word-deck-front])_&]:shadow-none"
        >
            <div
                data-phonetics-card-surface
                className="relative grid min-w-0 gap-6 rounded-[23px] bg-phonetics-card p-[23px] md:grid-cols-2 design:h-[358px] design:p-0 [[data-swap-index]:not([data-word-deck-front])_&]:bg-canvas"
            >
                <div
                    data-practice-reading-surface
                    className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-[12px] design:absolute design:left-[32px] design:top-[49px] design:w-[320px]"
                >
                    <img
                        data-practice-media
                        src={phoneticsWord.src}
                        draggable={false}
                        width={320}
                        height={200}
                        alt="音标练习共用演示插图：understand词义示例"
                        className="block aspect-[8/5] h-auto w-full rounded-[12px] object-cover"
                    />
                    <PracticeReadingOverlay reading={playbackDisabled ? undefined : reading} />
                    <button
                        type="button"
                        disabled={playbackDisabled}
                        aria-label={`播放 ${question.english} 的完整发音`}
                        onClick={onPlay}
                        className="absolute bottom-[10px] right-[10px] z-20 flex size-9 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                    >
                        <img
                            src={wordPlay.src}
                            width={36}
                            height={36}
                            alt=""
                            draggable={false}
                            className="block shrink-0"
                        />
                    </button>
                </div>
                <div className="flex min-w-0 flex-col items-center design:absolute design:left-[390px] design:top-[40px] design:w-[249px]">
                    <div className="relative w-max max-w-full">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-3 h-[46px] text-practice-control-text/50"
                        >
                            <span className="absolute inset-x-0 top-0 border-t border-dashed border-current" />
                            <span className="absolute inset-x-0 top-[15px] border-t border-dashed border-current" />
                            <span className="absolute inset-x-0 top-[30px] border-t border-dashed border-current" />
                            <span className="absolute inset-x-0 top-[45px] border-t border-dashed border-current" />
                        </div>
                        <h3 className="relative m-0 flex min-h-[56px] items-start gap-[3px] text-[32px] font-semibold leading-[56px] md:text-[40px]">
                            {content
                                ? content.segments.map((segment) => (
                                      <span
                                          key={segment.id}
                                          className={
                                              segment.ipa === content.lesson.targetPhonetic
                                                  ? 'relative text-phonetics-error'
                                                  : 'relative text-phonetics-success'
                                          }
                                      >
                                          {activeStep?.segmentId === segment.id && (
                                              <span
                                                  aria-hidden="true"
                                                  className="absolute inset-x-0 top-[10px] h-[46px] bg-phonetics-highlight"
                                              />
                                          )}
                                          <span className="relative">{segment.spelling}</span>
                                      </span>
                                  ))
                                : question.english}
                        </h3>
                    </div>
                    <div
                        role="group"
                        aria-label={`音素分块 ${question.phonetic}`}
                        className="mt-[19px] flex min-h-[35px] w-full max-w-[249px] flex-wrap items-center justify-center gap-[6px] text-[24px] font-light leading-[35px] text-practice-control-text/50"
                    >
                        {content ? (
                            <>
                                <span aria-hidden="true">/</span>
                                {content.segments.map((segment) => (
                                    <button
                                        type="button"
                                        key={segment.id}
                                        data-phonetics-segment={segment.id}
                                        disabled={playbackDisabled}
                                        aria-label={`播放 ${segment.spelling} 的音素 /${segment.ipa}/`}
                                        onClick={(): void => onSegmentPlay(segment.id)}
                                        className={
                                            activeStep?.segmentId === segment.id
                                                ? 'flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-[4px] bg-phonetics-highlight px-[5px] text-[18px] font-normal leading-[25px] outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default md:h-[30px] md:min-w-5'
                                                : 'flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-[4px] bg-practice-phoneme px-[5px] text-[18px] font-normal leading-[25px] outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default md:h-[30px] md:min-w-5'
                                        }
                                    >
                                        <span
                                            className={
                                                segment.ipa === content.lesson.targetPhonetic
                                                    ? 'text-phonetics-error'
                                                    : 'text-phonetics-success'
                                            }
                                        >
                                            {segment.ipa}
                                        </span>
                                    </button>
                                ))}
                                <span aria-hidden="true">/</span>
                            </>
                        ) : (
                            question.phonetic
                        )}
                    </div>
                    <p className="m-0 mt-[34px] w-full max-w-[249px] break-words text-center text-[18px] font-normal leading-[25px] text-practice-muted">
                        {question.translation}
                    </p>
                </div>
                {oralEnabled && (
                    <div className="min-w-0 md:col-span-2 design:absolute design:inset-x-[24px] design:top-[262px]">
                        <PhoneticsOralControls
                            controller={oralController}
                            disabled={disabled}
                            recordingWave={recordingWave}
                            readingWave={readingWave}
                        />
                    </div>
                )}
            </div>
        </article>
    )
}
