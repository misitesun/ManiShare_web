'use client'

import type { ReactElement, ReactNode } from 'react'
import { OralAssessmentContent } from '../../../features/oral-assessment'
import type {
    OralAssessmentDemoController,
    OralAssessmentTarget,
} from '../../../features/oral-assessment'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import wordAsset from '../assets/word-woman-e23d5f.png'
import sentenceAsset from '../assets/reading-scene.png'

interface WordOralAssessmentExerciseProps {
    readonly family?: 'word' | 'sentence' | 'audio' | 'video'
    readonly target: OralAssessmentTarget
    readonly controller: OralAssessmentDemoController
    readonly imageVisible: boolean
    readonly translationVisible: boolean
    readonly reading?: PracticeReadingView | undefined
    readonly media?: ReactNode
    readonly wave?: ReactNode
}

/** 各内容族共用口语正文和阶段；视频只注入自己的媒体及封面排版。 */
export function WordOralAssessmentExercise({
    family = 'word',
    target,
    controller,
    imageVisible,
    translationVisible,
    reading,
    media,
    wave,
}: WordOralAssessmentExerciseProps): ReactElement {
    return (
        <article
            data-word-oral-assessment-exercise={family === 'word' || undefined}
            data-sentence-oral-assessment-exercise={family === 'sentence' || undefined}
            data-audio-oral-assessment-exercise={family === 'audio' || undefined}
            data-video-oral-assessment-exercise={family === 'video' || undefined}
            data-stage={controller.stage}
            data-reference-node={
                family === 'video'
                    ? undefined
                    : controller.stage === 'idle'
                      ? '546:31837'
                      : controller.stage === 'result'
                        ? '2064:18873'
                        : '2046:18716'
            }
            className={
                family === 'video'
                    ? 'relative w-full min-w-0 shrink-0 px-4 pb-2 pt-12 md:pt-16 design:pt-[108px]'
                    : 'relative w-full min-w-0 shrink-0 px-4 pb-2 pt-16 design:pt-[144px] design:data-[stage=idle]:pt-[172px] design:data-[stage=result]:pt-[107px]'
            }
        >
            {media ? (
                <div className="mx-auto flex w-full min-w-0 justify-center">{media}</div>
            ) : imageVisible && family !== 'video' ? (
                <div
                    data-practice-reading-surface
                    className="relative mx-auto aspect-video w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={family === 'word' ? wordAsset.src : sentenceAsset.src}
                        alt={
                            family !== 'word'
                                ? family === 'audio'
                                    ? '音频练习共用示意插图'
                                    : '句子练习共用示意插图'
                                : '单词练习示意图：女人在公园散步'
                        }
                        width={430}
                        height={242}
                        className="absolute inset-0 block h-full w-full object-cover"
                    />
                    {reading?.status !== 'pending-source' && (
                        <PracticeReadingOverlay reading={reading} />
                    )}
                </div>
            ) : null}
            <div
                className={
                    family === 'video'
                        ? 'mx-auto w-full max-w-[1100px] min-w-0 design:pt-[25px]'
                        : 'mx-auto w-full max-w-[1100px] min-w-0'
                }
            >
                <OralAssessmentContent
                    target={target}
                    controller={controller}
                    presentation="page"
                    translationVisible={translationVisible}
                    wave={wave}
                />
            </div>
        </article>
    )
}
