import type { ReactElement } from 'react'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import { PictureScene } from './PictureScene'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { PracticeOralAssessmentButton } from './PracticeOralAssessmentButton'
import noteIcon from '../assets/sentence-listening-note.svg'

/** 2647:9783，主图与静态目标共用；媒体／题态／笔记与口语由练习会话拥有。 */
export function PictureListeningExercise({
    question,
    values,
    blind,
    blocked,
    reading,
    onNote,
    oralEnabled,
    onOral,
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly blind: boolean
    readonly blocked: boolean
    readonly reading?: PracticeReadingView | undefined
    readonly onNote: () => void
    readonly oralEnabled: boolean
    readonly onOral: () => void
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const textStyle =
        values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize, lineHeight: 1.4 }
    return (
        <section
            data-picture-listening-exercise
            className="flex min-w-0 flex-col items-center pb-[10px] pt-[59px] text-center"
        >
            <PictureScene
                width={844}
                height={565}
                showSceneInfo={false}
                highlight
                reading={reading}
            />
            <div
                aria-hidden={blind}
                className={blind ? 'invisible mt-7 max-w-full' : 'mt-7 max-w-full'}
            >
                <p className="min-h-5 text-[14px] leading-5 text-practice-muted">
                    {values.showAnswerPhonetics && (
                        <PracticeWordPhonetics phonetic={question.phonetic} />
                    )}
                </p>
                <p
                    data-practice-english
                    style={textStyle}
                    className="mt-1.5 min-h-[56px] break-words text-[28px] font-medium leading-[56px] text-practice-text md:text-[34px] design:text-[40px]"
                >
                    {question.english}
                </p>
            </div>
            <p
                data-practice-translation
                style={textStyle}
                className="mt-[11px] max-w-full break-words text-[20px] font-normal leading-[42px] text-practice-text md:text-[24px] design:text-[30px]"
            >
                {question.translation}
            </p>
            <button
                type="button"
                data-picture-listening-note
                disabled={blocked}
                onClick={onNote}
                className="mt-[10px] inline-flex min-h-10 w-[76px] cursor-pointer items-center justify-center gap-0.5 rounded border border-practice-muted/50 text-[16px] font-normal text-practice-muted outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 design:min-h-[30px]"
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
            <div
                data-picture-listening-oral-slot
                className="mt-[22px] flex h-[46px] w-full justify-center"
            >
                {oralEnabled && (
                    <PracticeOralAssessmentButton disabled={blocked} onClick={onOral} />
                )}
            </div>
        </section>
    )
}
