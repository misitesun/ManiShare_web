'use client'

import type { ReactElement, ReactNode } from 'react'
import type { LearningPreferences } from '../../../features/learning-settings'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import type { ImmersiveListeningFamily } from '../model/sentence-listening-playback'
import { getSentenceGameLabel } from '../model/sentence-game-family'
import { getSentenceListeningReference } from '../model/reference-layout'
import { AnnotatedText } from './AnnotatedText'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { PracticeOralAssessmentButton } from './PracticeOralAssessmentButton'
import scene from '../assets/reading-scene.png'
import noteIcon from '../assets/sentence-listening-note.svg'

export interface SentenceListeningExerciseProps {
    readonly family?: ImmersiveListeningFamily | 'video' | 'picture'
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly imageVisible: boolean
    readonly translationVisible: boolean
    readonly blocked: boolean
    readonly blind?: boolean
    readonly plainEnglish?: boolean
    /** 视频拼块答案态沿局部“拆句”设置，其余消费者默认保留逐词解析。 */
    readonly annotated?: boolean
    readonly reading?: PracticeReadingView | undefined
    /** 答对后复用题目自身的媒体槽，视频与看图不回退到句子示意图。 */
    readonly media?: ReactNode
    readonly onNote: () => void
    readonly oralEnabled: boolean
    readonly onOral: () => void
}

/** 句子与音频共用的页面内部听力题面；生命周期由同一练习装配持有。 */
export function SentenceListeningExercise({
    family = 'sentence',
    question,
    values,
    imageVisible,
    translationVisible,
    blocked,
    blind = false,
    plainEnglish = false,
    annotated = true,
    reading,
    media,
    onNote,
    oralEnabled,
    onOral,
}: SentenceListeningExerciseProps): ReactElement {
    const reference = getSentenceListeningReference(family === 'audio' ? 'audio' : 'sentence')
    const familyLabel = getSentenceGameLabel(family)
    const appearance = getPreviewAppearance(values)
    const mediaVisible = media !== undefined || imageVisible
    return (
        <section
            data-practice-listening={family}
            data-sentence-listening={family === 'sentence' ? '' : undefined}
            data-audio-listening={family === 'audio' ? '' : undefined}
            data-reference-node={reference.node}
            aria-label={
                family === 'video' || family === 'picture'
                    ? `${familyLabel}练习答案解析`
                    : `${familyLabel}沉浸听力`
            }
            className="flex min-w-0 flex-1 flex-col px-4 pt-10 text-center md:px-6 md:pt-12 design:pt-[108px]"
        >
            <div
                data-sentence-listening-content
                className="flex min-w-0 shrink-0 flex-col items-center"
            >
                {media ??
                    (imageVisible && (
                        <div
                            data-practice-reading-surface
                            className="relative w-full max-w-[430px] overflow-hidden rounded-[20px]"
                        >
                            <img
                                data-practice-media
                                src={scene.src}
                                alt={`${familyLabel}练习共用示意插图`}
                                width={reference.media.width}
                                height={reference.media.height}
                                className="block aspect-[430/242] h-auto w-full object-cover"
                            />
                            <PracticeReadingOverlay reading={reading} />
                        </div>
                    ))}
                <div
                    data-sentence-listening-analysis
                    aria-hidden={blind}
                    className={
                        mediaVisible ? 'mt-8 max-w-full md:mt-10 design:mt-[59px]' : 'max-w-full'
                    }
                >
                    <div className={blind ? 'invisible' : 'visible'}>
                        <AnnotatedText
                            question={question}
                            values={values}
                            annotated={annotated}
                            variant="sentence-listening"
                            listeningGrammarFill={false}
                            listeningEnglishTone={plainEnglish ? 'foreground' : 'answer'}
                            titleFirstWord
                        />
                    </div>
                </div>
                {translationVisible && (
                    <p
                        data-practice-translation
                        className="mt-8 max-w-full break-words text-[20px] font-medium leading-[normal] text-practice-text md:text-[24px] design:mt-[52.5px] design:text-[30px]"
                        style={
                            values.fontSize === '默认'
                                ? undefined
                                : { fontSize: appearance.fontSize }
                        }
                    >
                        {question.translation}
                    </p>
                )}
                <button
                    type="button"
                    data-sentence-listening-note
                    disabled={blocked}
                    onClick={onNote}
                    className="mt-7 inline-flex min-h-10 w-[76px] cursor-pointer items-center justify-center gap-0.5 rounded border border-practice-muted/50 text-[16px] font-normal leading-[normal] text-practice-muted outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 design:min-h-[30px]"
                >
                    <img
                        src={noteIcon.src}
                        alt=""
                        width={20}
                        height={20}
                        className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                    />
                    笔记
                </button>
            </div>
            <div className="mt-auto shrink-0 pt-10 design:pt-[59px]">
                <div
                    data-sentence-listening-oral-slot
                    aria-hidden={!oralEnabled}
                    className="flex h-[46px] min-w-0 justify-center"
                >
                    {oralEnabled && (
                        <PracticeOralAssessmentButton disabled={blocked} onClick={onOral} />
                    )}
                </div>
            </div>
            <div data-sentence-listening-result-slot aria-hidden="true" className="h-12 shrink-0" />
        </section>
    )
}
