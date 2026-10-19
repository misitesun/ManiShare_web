'use client'

import { useId, useState } from 'react'
import type { ReactElement } from 'react'
import { LottiePreview } from '../../../shared/lib/animation'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import {
    chapterCompleteAnimation,
    correctAnimations,
    resolveCorrectAnimationId,
} from '../model/feedback-animations'
import type { PreferenceControlsProps } from './SettingControls'
import { SettingsSection } from './SettingControls'

export function AnimationEffectSettings({ values, update }: PreferenceControlsProps): ReactElement {
    const name = useId()
    const [revision, setRevision] = useState(0)
    const selected = resolveCorrectAnimationId(values.correctEffectType)
    return (
        <SettingsSection title="动画特效">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-body text-primary">答对动画特效</p>
                    <p className="mt-1 text-caption leading-relaxed text-muted">
                        如遇卡顿，可尝试切换或关闭此功能
                    </p>
                </div>
                <TldSwitch
                    label="答对动画特效"
                    showLabel={false}
                    checked={values.correctEffect}
                    onCheckedChange={(checked): void => update('correctEffect', checked)}
                />
            </div>
            {values.correctEffect ? (
                <div className="space-y-3">
                    <p className="text-body text-primary">答对特效类型</p>
                    <div
                        role="radiogroup"
                        aria-label="答对特效类型"
                        className="grid grid-cols-[repeat(auto-fit,minmax(120px,150px))] gap-5"
                    >
                        {correctAnimations.map((animation) => (
                            <label
                                key={animation.id}
                                className="relative block aspect-square min-w-0 cursor-pointer has-disabled:cursor-not-allowed"
                            >
                                <input
                                    type="radio"
                                    name={name}
                                    value={animation.id}
                                    checked={selected === animation.id}
                                    aria-label={animation.label}
                                    className="peer sr-only cursor-pointer disabled:cursor-not-allowed"
                                    onClick={(): void => setRevision((value) => value + 1)}
                                    onChange={(): void => update('correctEffectType', animation.id)}
                                />
                                <span
                                    data-animation-option={animation.id}
                                    className="block size-full overflow-hidden rounded-lg border border-strong bg-surface/30 peer-checked:border-brand peer-checked:ring-1 peer-checked:ring-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
                                >
                                    <LottiePreview
                                        loadData={animation.loadData}
                                        speed={animation.speed}
                                        revision={selected === animation.id ? revision : 0}
                                    />
                                </span>
                                <span className="sr-only">{animation.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
                <p className="text-body text-primary">章节完成动画特效</p>
                <TldSwitch
                    label="章节完成动画特效"
                    showLabel={false}
                    checked={values.completionEffect}
                    onCheckedChange={(checked): void => update('completionEffect', checked)}
                />
            </div>
            {values.completionEffect ? (
                <div className="space-y-3">
                    <p className="text-body text-primary">章节完成特效预览</p>
                    <div
                        className="size-[150px] overflow-hidden rounded-lg border border-brand bg-surface/30"
                        aria-label="章节完成特效预览"
                    >
                        <LottiePreview loadData={chapterCompleteAnimation.loadData} />
                    </div>
                </div>
            ) : null}
        </SettingsSection>
    )
}
