'use client'

import { useRef, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { TldButton } from '../../../shared/ui/tld-button'
import { getPreviewAppearance } from '../model/appearance-preview'
import type { LearningPreferences } from '../model/preferences'

interface PreviewStyle extends CSSProperties {
    '--app-color-practice-answer': string
    '--app-color-practice-text': string
    '--app-color-practice-background': string
}

function WavePreview({ label, style }: { label: string; style: string }): ReactElement {
    const bars = [4, 10, 18, 8, 24, 32, 20, 12, 28, 40, 22, 14, 30, 18, 8, 24, 36, 12, 6]
    return (
        <div className="min-w-0 rounded-lg border border-subtle bg-surface p-3">
            <p className="mb-3 text-caption text-muted">
                {label} · {style}
            </p>
            <div
                role="img"
                aria-label={`${label}的${style}示意`}
                className="flex h-14 items-center justify-center gap-1 overflow-hidden text-brand"
            >
                {style === '曲线频谱' || style === '波形线条' ? (
                    <svg viewBox="0 0 220 60" className="h-14 w-full" aria-hidden="true">
                        <path
                            d={
                                style === '曲线频谱'
                                    ? 'M0 30 Q10 30 20 28 T40 20 T60 45 T80 8 T100 52 T120 15 T140 40 T160 24 T180 32 T220 30'
                                    : 'M0 30 L20 30 L28 22 L36 38 L46 12 L56 52 L68 5 L78 45 L88 20 L98 40 L108 28 L120 30 L132 15 L142 48 L152 10 L164 36 L176 24 L186 30 L220 30'
                            }
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    </svg>
                ) : (
                    bars.map((height, index) => (
                        <span
                            key={index}
                            className={
                                style === '雨滴点阵'
                                    ? 'flex flex-col gap-1'
                                    : 'flex flex-col gap-0.5'
                            }
                        >
                            {style === '默认竖条' ? (
                                <span
                                    className="block w-1 rounded-full bg-brand"
                                    style={{ height }}
                                />
                            ) : (
                                Array.from({ length: Math.ceil(height / 6) }, (_, point) => (
                                    <span
                                        key={point}
                                        className={
                                            style === '雨滴点阵'
                                                ? 'block size-1 rounded-full bg-brand'
                                                : 'block size-1.5 bg-brand'
                                        }
                                    />
                                ))
                            )}
                        </span>
                    ))
                )}
            </div>
        </div>
    )
}

export function AppearancePreview({ values }: { values: LearningPreferences }): ReactElement {
    const preview = getPreviewAppearance(values)
    const root = useRef<HTMLDivElement>(null)
    const [effect, setEffect] = useState<'correct' | 'completion' | null>(null)
    const [sequence, setSequence] = useState(0)
    const activeEffect =
        (effect === 'correct' && values.correctEffect) ||
        (effect === 'completion' && values.completionEffect)
            ? effect
            : null
    const { contextSafe } = useGSAP({ scope: root })
    const animate = contextSafe((kind: 'correct' | 'completion'): void => {
        setEffect(kind)
        setSequence((current) => current + 1)
    })
    useGSAP(
        () => {
            if (activeEffect === null) return
            const element = root.current?.querySelector('[data-effect]')
            if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
            gsap.fromTo(
                element,
                { y: 12, scale: 0.85, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' },
            )
        },
        { scope: root, dependencies: [activeEffect, sequence], revertOnUpdate: true },
    )
    const previewStyle: PreviewStyle = {
        '--app-color-practice-answer': preview.answerColor,
        '--app-color-practice-text': preview.textColor,
        '--app-color-practice-background': preview.backgroundColor,
        fontFamily: preview.fontFamily,
    }
    return (
        <div ref={root} className="space-y-4">
            <div className="rounded-panel border border-subtle bg-surface p-4 md:p-6">
                <p className="mb-4 text-label font-medium text-primary">外观预览</p>
                <div
                    className="rounded-xl border border-strong bg-practice-background p-5 text-practice-text transition-colors"
                    style={previewStyle}
                >
                    <p className="text-caption">课程名 · 示例练习</p>
                    <div className="my-7 flex flex-col items-center gap-3 text-center">
                        <p className="text-body">/ həˈləʊ /</p>
                        <span
                            className="border-b-[3px] border-practice-answer px-2 pb-2 leading-tight"
                            style={{
                                fontSize: preview.fontSize,
                                borderBottomStyle: preview.borderStyle,
                            }}
                        >
                            Hello!
                        </span>
                        <p className="text-body">你好</p>
                        <div
                            className={
                                values.grammarColor
                                    ? 'mt-3 rounded-lg bg-brand/15 p-3 text-practice-text'
                                    : 'mt-3 rounded-lg border border-subtle p-3 text-practice-text'
                            }
                            style={{
                                fontSize: preview.grammarFontSize,
                                opacity: preview.grammarOpacity,
                            }}
                        >
                            <p
                                className={
                                    values.grammarColor ? 'text-brand' : 'text-practice-text'
                                }
                            >
                                词性 · 感叹词
                            </p>
                            <p>Hello! · 语法结构</p>
                        </div>
                        <div className="mt-4 w-full rounded-lg border border-subtle p-4">
                            <p className="mb-3 text-caption">答案模糊预览</p>
                            <span
                                className="inline-block text-body"
                                style={{ filter: `blur(${preview.blur}px)` }}
                            >
                                Hello! 你好
                            </span>
                        </div>
                        {activeEffect !== null ? (
                            <div
                                key={sequence}
                                data-effect
                                role="status"
                                className="pt-2 text-body text-practice-text"
                            >
                                {effect === 'correct'
                                    ? `${values.correctEffectType} 答题正确`
                                    : '课程完成！'}
                            </div>
                        ) : null}
                    </div>
                    <div className="flex justify-between gap-2 text-caption">
                        <span>上一题</span>
                        <span>暂停练习</span>
                        <span>下一题</span>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <TldButton
                        variant="secondary"
                        disabled={!values.correctEffect}
                        onClick={(): void => animate('correct')}
                    >
                        预览答题正确特效
                    </TldButton>
                    <TldButton
                        variant="secondary"
                        disabled={!values.completionEffect}
                        onClick={(): void => animate('completion')}
                    >
                        预览课程完成特效
                    </TldButton>
                </div>
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
