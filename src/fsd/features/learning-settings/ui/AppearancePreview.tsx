'use client'

import type { CSSProperties, ReactElement } from 'react'
import { getPreviewAppearance } from '../model/appearance-preview'
import type { LearningPreferences } from '../model/preferences'
import type { PracticeBackgroundImage } from '../model/practice-background'
import { PracticeBackgroundSurface } from './PracticeBackgroundSurface'
import { LearningAudioWave } from './LearningAudioWave'

interface PreviewStyle extends CSSProperties {
    '--app-color-practice-answer': string
    '--app-color-practice-text': string
    '--app-color-practice-background': string
}

function WavePreview({ label, style }: { label: string; style: string }): ReactElement {
    return (
        <div className="min-w-0 rounded-lg border border-subtle bg-surface p-3">
            <p className="mb-3 text-caption text-muted">
                {label} · {style}
            </p>
            <LearningAudioWave style={style} label={`${label}的${style}示意`} />
        </div>
    )
}

export function AppearancePreview({
    values,
    image = null,
}: {
    values: LearningPreferences
    image?: PracticeBackgroundImage | null
}): ReactElement {
    const preview = getPreviewAppearance(values)
    const previewStyle: PreviewStyle = {
        '--app-color-practice-answer': preview.answerColor,
        '--app-color-practice-text': preview.textColor,
        '--app-color-practice-background': preview.backgroundColor,
    }
    return (
        <div className="space-y-4" style={previewStyle}>
            <div className="rounded-panel border border-subtle bg-surface p-4 md:p-6">
                <p className="mb-4 text-label font-medium text-primary">外观预览</p>
                <PracticeBackgroundSurface
                    fontFamily={preview.fontFamily}
                    image={values.backgroundSource === 'image' ? image : null}
                    dim={values.backgroundDim}
                    blur={values.backgroundBlur}
                    color={preview.backgroundColor}
                >
                    <p className="text-caption">课程名 · 示例练习</p>
                    <div
                        className="my-7 flex flex-col items-center gap-3 text-center"
                        role="group"
                        aria-label="答题预览"
                    >
                        <p className="text-caption">答题显示</p>
                        {values.showPhonetics ? (
                            <p className="text-body" aria-label="答题音标">
                                / həˈləʊ /
                            </p>
                        ) : null}
                        <span
                            className="border-b-[3px] border-practice-answer px-2 pb-2 leading-tight"
                            style={{
                                fontSize: preview.fontSize,
                                borderBottomStyle: preview.borderStyle,
                            }}
                        >
                            Hello!
                        </span>
                        {values.showTranslation ? <p className="text-body">你好</p> : null}
                    </div>
                    <div className="my-7 space-y-3 text-center" role="group" aria-label="答案预览">
                        <p className="text-caption">答案显示 · 沉浸听力 / 答题后</p>
                        {values.showAnswerPhonetics ? (
                            <p className="text-body" aria-label="答案音标">
                                / həˈləʊ /
                            </p>
                        ) : null}
                        {values.showPartOfSpeech || values.showGrammarText ? (
                            <div
                                className="relative isolate mx-auto w-fit rounded-lg p-3"
                                style={{ fontSize: preview.grammarFontSize }}
                            >
                                {values.showGrammarFill ? (
                                    <span
                                        aria-hidden="true"
                                        data-grammar-fill
                                        className="pointer-events-none absolute inset-0 -z-[1] rounded-lg bg-brand"
                                        style={{ opacity: preview.grammarOpacity }}
                                    />
                                ) : null}
                                {values.showPartOfSpeech ? (
                                    <p aria-label="词性预览">词性 · 感叹词</p>
                                ) : null}
                                {values.showGrammarText ? (
                                    <p aria-label="语法标注预览">Hello! · 语法结构</p>
                                ) : null}
                            </div>
                        ) : null}
                        <div className="mt-4 rounded-lg border border-subtle p-4">
                            <p className="mb-3 text-caption">答案模糊预览</p>
                            <span
                                className="inline-block text-body"
                                style={{ filter: `blur(${preview.blur}px)` }}
                            >
                                Hello! 你好
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between gap-2 text-caption">
                        <span>上一题</span>
                        <span>暂停练习</span>
                        <span>下一题</span>
                    </div>
                </PracticeBackgroundSurface>
                <p className="mt-3 text-caption leading-relaxed text-muted">
                    示例随设置即时变化；练习中的实际生效随课程功能接入。
                </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <WavePreview label="录音样式" style={values.recordingWave} />
                <WavePreview label="朗读样式" style={values.readingWave} />
            </div>
        </div>
    )
}
