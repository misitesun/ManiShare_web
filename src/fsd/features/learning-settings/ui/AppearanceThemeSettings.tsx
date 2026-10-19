'use client'

import { useId, useRef } from 'react'
import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { useAppTheme, useThemeTransition } from '../../../shared/theme'
import { backgroundPresets, getBackgroundPresetColor } from '../model/practice-background'
import type { PracticeBackgroundState } from '../model/usePracticeBackgroundImage'
import type { LearningPreferences, SettingsGroup } from '../model/preferences'
import { SettingControl, SettingsSection } from './SettingControls'
import type { PreferenceControlsProps } from './SettingControls'
import { PracticeBackgroundSurface } from './PracticeBackgroundSurface'

interface AppearanceThemeSettingsProps extends PreferenceControlsProps {
    readonly group: SettingsGroup
    readonly background: PracticeBackgroundState
    readonly patch: (changes: Partial<LearningPreferences>) => void
}

export function AppearanceThemeSettings({
    group,
    values,
    update,
    patch,
    background,
}: AppearanceThemeSettingsProps): ReactElement {
    const { theme } = useAppTheme()
    const themeGroup = useId()
    const origin = useRef<HTMLDivElement>(null)
    const input = useRef<HTMLInputElement>(null)
    const transitionTheme = useThemeTransition({ originRef: origin })
    return (
        <SettingsSection title={group.title}>
            <div ref={origin}>
                <p className="mb-3 text-body text-primary">主题切换</p>
                <div role="radiogroup" aria-label="主题切换" className="grid grid-cols-2 gap-6">
                    <TldSelection
                        type="radio"
                        layout="inline"
                        name={themeGroup}
                        value="light"
                        label="白天模式"
                        checked={theme === 'light'}
                        onCheckedChange={(checked): void => {
                            if (checked) transitionTheme('light')
                        }}
                    >
                        白天模式
                    </TldSelection>
                    <TldSelection
                        type="radio"
                        layout="inline"
                        name={themeGroup}
                        value="dark"
                        label="夜间模式"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked): void => {
                            if (checked) transitionTheme('dark')
                        }}
                    >
                        夜间模式
                    </TldSelection>
                </div>
            </div>
            <div>
                <p className="text-body text-primary">练习背景色</p>
                <p className="mt-1 text-caption text-muted">
                    选择游戏练习时的背景颜色，或上传自定义背景图。
                </p>
                <div role="group" aria-label="练习背景配色" className="mt-4 flex flex-wrap gap-4">
                    {backgroundPresets.map((preset) => {
                        const selected =
                            values.backgroundSource === 'preset' &&
                            values.backgroundPreset === preset.id
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                aria-label={preset.label + '练习背景'}
                                aria-pressed={selected}
                                disabled={!background.ready || background.busy}
                                className="flex min-w-14 cursor-pointer flex-col items-center gap-2 rounded-lg p-1 text-caption text-muted aria-pressed:text-brand focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed"
                                onClick={(): void =>
                                    patch({
                                        backgroundPreset: preset.id,
                                        backgroundSource: 'preset',
                                    })
                                }
                            >
                                <span
                                    aria-hidden="true"
                                    className={
                                        selected
                                            ? 'size-9 rounded-lg border-2 border-brand'
                                            : 'size-9 rounded-lg border border-strong'
                                    }
                                    style={{ backgroundColor: preset.color }}
                                />
                                {preset.label}
                            </button>
                        )
                    })}
                </div>
            </div>
            <div>
                <input
                    ref={input}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label="上传练习背景图"
                    className="hidden"
                    disabled={!background.ready || background.busy}
                    onChange={(event): void => {
                        const file = event.currentTarget.files?.[0]
                        event.currentTarget.value = ''
                        if (file === undefined) return
                        void background.upload(file).then((saved): void => {
                            if (saved) patch({ backgroundSource: 'image' })
                        })
                    }}
                />
                <div className="flex flex-wrap items-center gap-3">
                    <TldButton
                        variant="secondary"
                        disabled={!background.ready || background.busy}
                        onClick={(): void => input.current?.click()}
                    >
                        {background.busy
                            ? '正在压缩并保存…'
                            : background.image === null
                              ? '上传背景图'
                              : '更换背景图'}
                    </TldButton>
                    {background.image !== null ? (
                        <>
                            {values.backgroundSource !== 'image' ? (
                                <TldButton
                                    variant="secondary"
                                    disabled={background.busy}
                                    onClick={(): void => patch({ backgroundSource: 'image' })}
                                >
                                    使用已保存背景图
                                </TldButton>
                            ) : null}
                            <TldButton
                                variant="subtle"
                                disabled={background.busy}
                                onClick={(): void => {
                                    if (background.remove()) patch({ backgroundSource: 'preset' })
                                }}
                            >
                                移除
                            </TldButton>
                        </>
                    ) : null}
                </div>
                <p className="mt-3 text-caption leading-relaxed text-muted">
                    支持JPG/PNG/WebP，单张最大10MB，选择后自动压缩并保存到本机。推荐1920px以上、主体避开中央的横向大图。
                </p>
                {background.busy ? (
                    <p role="status" className="mt-2 text-caption text-muted">
                        正在处理图片，请稍候…
                    </p>
                ) : null}
                {background.error !== null ? (
                    <p role="alert" className="mt-2 text-caption text-danger">
                        {background.error}
                    </p>
                ) : null}
            </div>
            {background.image !== null ? (
                <>
                    <div className="max-w-[450px]">
                        <PracticeBackgroundSurface
                            variant="sample"
                            image={background.image}
                            dim={values.backgroundDim}
                            blur={values.backgroundBlur}
                            color={getBackgroundPresetColor(values.backgroundPreset)}
                        >
                            <div className="space-y-6 text-center">
                                <p className="text-body font-medium">这是什么？</p>
                                <div
                                    aria-hidden="true"
                                    className="mx-auto flex max-w-48 items-center justify-between gap-4"
                                >
                                    <span className="h-[3px] w-14 rounded bg-brand" />
                                    <span className="h-[3px] w-12 rounded bg-strong" />
                                    <span className="h-[3px] w-10 rounded bg-strong" />
                                    <span>？</span>
                                </div>
                            </div>
                        </PracticeBackgroundSurface>
                        <p
                            className="mt-2 truncate text-caption text-muted"
                            title={background.image.name}
                        >
                            {background.image.name} · {background.image.width}×
                            {background.image.height} · 已保存到本机
                        </p>
                        {values.backgroundSource !== 'image' ? (
                            <p className="mt-1 text-caption text-muted">
                                当前使用纯色方案，图片保留供再次选择。
                            </p>
                        ) : null}
                    </div>
                    {group.fields.map((field) => (
                        <SettingControl
                            key={field.key}
                            field={field}
                            values={values}
                            update={update}
                        />
                    ))}
                </>
            ) : null}
        </SettingsSection>
    )
}
