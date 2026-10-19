'use client'

import type { ReactElement } from 'react'
import type { LearningPreferences } from '../../../features/learning-settings'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import { getSentenceListeningReference } from '../model/reference-layout'
import { AnnotatedText } from './AnnotatedText'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import scene from '../assets/reading-scene.png'
import noteIcon from '../assets/sentence-listening-note.svg'
import oralIcon from '../assets/sentence-listening-oral.svg'

export interface SentenceListeningExerciseProps {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly imageVisible: boolean
    readonly translationVisible: boolean
    readonly blocked: boolean
    readonly reading?: PracticeReadingView | undefined
    readonly onNote: () => void
    readonly oralEnabled: boolean
    readonly onOral: () => void
}

/** 句子沉浸听力的页面内部入口；会话、笔记、口语与朗读生命周期由公共装配持有。 */
export function SentenceListeningExercise({
    question,
    values,
    imageVisible,
    translationVisible,
    blocked,
    reading,
    onNote,
    oralEnabled,
    onOral,
}: SentenceListeningExerciseProps): ReactElement {
    const reference = getSentenceListeningReference()
    const appearance = getPreviewAppearance(values)
    return (
        <section
            data-sentence-listening
            data-reference-node={reference.node}
            aria-label="句子沉浸听力"
            className="flex min-w-0 flex-col items-center px-4 pb-12 pt-10 text-center md:pt-12 design:pt-[108px]"
        >
            {imageVisible && (
                <div
                    data-practice-reading-surface
                    className="relative w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={scene.src}
                        alt="句子练习本地示例插图"
                        width={reference.media.width}
                        height={reference.media.height}
                        className="block aspect-[430/242] h-auto w-full object-cover"
                    />
                    <PracticeReadingOverlay reading={reading} />
                </div>
            )}
            <div
                className={
                    imageVisible ? 'mt-8 max-w-full md:mt-10 design:mt-[59px]' : 'max-w-full'
                }
            >
                <AnnotatedText
                    question={question}
                    values={values}
                    annotated
                    variant="sentence-listening"
                    titleFirstWord
                />
            </div>
            {translationVisible && (
                <p
                    data-practice-translation
                    className="mt-8 max-w-full break-words text-[20px] font-medium leading-[normal] text-practice-text md:text-[24px] design:mt-[52.5px] design:text-[30px]"
                    style={
                        values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
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
            {oralEnabled && (
                <button
                    type="button"
                    data-practice-quick-oral
                    data-practice-command="practice.oral"
                    disabled={blocked}
                    onClick={onOral}
                    className="mt-10 h-[46px] w-[234px] max-w-full cursor-pointer rounded-[25px] bg-linear-[127deg] from-brand-start to-brand-end p-px shadow-[var(--app-shadow-sentence-listening-oral)] outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 design:mt-[59px]"
                >
                    <span className="flex size-full items-center justify-center gap-0.5 rounded-[inherit] bg-practice-background px-2 text-[14px] font-medium leading-[normal] tracking-[0.08em] text-practice-text md:px-0 md:text-[16px]">
                        <img
                            src={oralIcon.src}
                            alt=""
                            width={28}
                            height={28}
                            className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                        />
                        口语评测<span className="hidden md:inline">·点击或字母V</span>
                    </span>
                </button>
            )}
        </section>
    )
}
