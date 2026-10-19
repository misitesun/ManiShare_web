'use client'

import { useId, useState } from 'react'
import type { ReactElement, ReactNode, CSSProperties } from 'react'
import { TldSelect } from '../../../shared/ui/tld-select'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import { isPreferenceColor } from '../model/preferences'
import { preferenceColorLabel, resolvePreferenceColor } from '../model/practice-background'
import type { LearningPreferences, PreferenceField } from '../model/preferences'

export interface PreferenceControlsProps {
    values: LearningPreferences
    update: <K extends keyof LearningPreferences>(key: K, value: LearningPreferences[K]) => void
}

export function SettingsSection({
    title,
    children,
}: {
    title: string
    children: ReactNode
}): ReactElement {
    return (
        <section className="min-w-0 rounded-panel border border-subtle bg-canvas p-4 md:p-6">
            <h2 className="mb-6 flex items-center gap-3 text-section-title font-medium text-primary">
                <span aria-hidden="true" className="h-5 w-1 shrink-0 rounded-full bg-brand" />
                {title}
            </h2>
            <div className="space-y-6">{children}</div>
        </section>
    )
}

function ColorControl({
    label,
    value,
    onChange,
    answer = false,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    answer?: boolean
}): ReactElement {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState('theme')
    const [themeColor, setThemeColor] = useState('')
    const inputId = useId()
    const valid = isPreferenceColor(draft)
    const swatchStyle: CSSProperties = {
        backgroundColor: resolvePreferenceColor(
            value,
            answer ? 'var(--app-color-brand)' : 'var(--app-color-text-primary)',
        ),
    }
    return (
        <div>
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    aria-label={`编辑${label}`}
                    aria-description={preferenceColorLabel(value)}
                    className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-strong bg-surface px-3 text-label text-primary hover:border-brand focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={(): void => {
                        setDraft(isPreferenceColor(value) ? value : 'theme')
                        setThemeColor(
                            getComputedStyle(document.documentElement)
                                .getPropertyValue(
                                    answer ? '--app-color-brand' : '--app-color-text-primary',
                                )
                                .trim(),
                        )
                        setOpen(true)
                    }}
                >
                    <span
                        aria-hidden="true"
                        className="size-5 rounded border border-strong"
                        style={swatchStyle}
                    />
                    {answer ? '随意选择颜色' : preferenceColorLabel(value)}
                </button>
                {answer ? (
                    <span className="text-caption text-muted">{preferenceColorLabel(value)}</span>
                ) : null}
            </div>
            {answer ? (
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="答题颜色预设">
                    <TldButton variant="secondary" onClick={(): void => onChange('dark-default')}>
                        夜间模式默认色
                    </TldButton>
                    <TldButton variant="secondary" onClick={(): void => onChange('light-default')}>
                        白天模式默认色
                    </TldButton>
                    <TldButton variant="secondary" onClick={(): void => onChange('theme')}>
                        恢复答题默认主题色
                    </TldButton>
                </div>
            ) : (
                <div className="mt-3">
                    <TldButton variant="secondary" onClick={(): void => onChange('theme')}>
                        恢复文字默认主题色
                    </TldButton>
                </div>
            )}
            <TldDialog
                title={label}
                size="small"
                open={open}
                onOpenChange={setOpen}
                confirmDisabled={!valid}
                onConfirm={(): void => {
                    if (valid) onChange(draft)
                }}
            >
                <div className="space-y-4">
                    <label htmlFor={inputId} className="block text-body text-primary">
                        颜色值
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            aria-label={`选择${label}`}
                            type="color"
                            value={draft === 'theme' || !valid ? themeColor : draft}
                            onChange={(event): void => setDraft(event.currentTarget.value)}
                            className="h-10 w-12 cursor-pointer rounded border border-strong bg-surface"
                        />
                        <input
                            id={inputId}
                            value={draft === 'theme' ? '' : draft}
                            placeholder="默认主题色 / #RRGGBB"
                            maxLength={7}
                            aria-invalid={!valid}
                            aria-describedby={`${inputId}-help`}
                            onChange={(event): void =>
                                setDraft(
                                    event.currentTarget.value === ''
                                        ? 'theme'
                                        : event.currentTarget.value,
                                )
                            }
                            className="h-10 min-w-0 flex-1 cursor-text rounded-lg border border-strong bg-surface px-3 text-body text-primary focus-visible:outline-2 focus-visible:outline-focus"
                        />
                    </div>
                    <p
                        id={`${inputId}-help`}
                        className={valid ? 'text-caption text-muted' : 'text-caption text-danger'}
                    >
                        {valid
                            ? '清空使用当前主题色；确认后保存，取消保留原值。'
                            : '请输入六位十六进制颜色，例如 #RRGGBB。'}
                    </p>
                    <TldButton variant="secondary" onClick={(): void => setDraft('theme')}>
                        清空
                    </TldButton>
                </div>
            </TldDialog>
        </div>
    )
}

export function SettingControl({
    field,
    values,
    update,
}: PreferenceControlsProps & { field: PreferenceField }): ReactElement {
    const id = useId()
    const descriptionId = `${id}-description`
    if (field.kind === 'toggle') {
        return (
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-body text-primary">{field.label}</p>
                    {field.description ? (
                        <p
                            id={descriptionId}
                            className="mt-1 text-caption leading-relaxed text-muted"
                        >
                            {field.description}
                        </p>
                    ) : null}
                </div>
                <TldSwitch
                    label={field.label}
                    showLabel={false}
                    descriptionId={field.description ? descriptionId : undefined}
                    checked={values[field.key]}
                    onCheckedChange={(checked): void => update(field.key, checked)}
                />
            </div>
        )
    }
    return (
        <div className="min-w-0 space-y-3">
            <label
                htmlFor={field.kind === 'range' ? id : undefined}
                className="block text-body text-primary"
            >
                {field.label}
            </label>
            {field.description ? (
                <p id={descriptionId} className="text-caption leading-relaxed text-muted">
                    {field.description}
                </p>
            ) : null}
            {field.kind === 'select' ? (
                <TldSelect
                    label={field.label}
                    value={values[field.key]}
                    options={field.options.map((option) => ({ value: option, label: option }))}
                    onValueChange={(value): void => update(field.key, value)}
                />
            ) : field.kind === 'radio' ? (
                <div
                    role="radiogroup"
                    aria-label={field.label}
                    className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-5 gap-y-2"
                >
                    {field.options.map((option) => (
                        <TldSelection
                            key={option}
                            type="radio"
                            name={`${id}-${field.key}`}
                            value={option}
                            layout="inline"
                            label={option}
                            checked={values[field.key] === option}
                            onCheckedChange={(checked): void => {
                                if (checked) update(field.key, option)
                            }}
                        >
                            {option}
                        </TldSelection>
                    ))}
                </div>
            ) : field.kind === 'color' ? (
                <ColorControl
                    label={field.label}
                    value={values[field.key]}
                    answer={field.key === 'answerColor'}
                    onChange={(value): void => update(field.key, value)}
                />
            ) : field.kind === 'range' ? (
                <div className="flex items-center gap-4">
                    <input
                        id={id}
                        type="range"
                        aria-label={field.label}
                        aria-describedby={field.description ? descriptionId : undefined}
                        aria-valuetext={`${values[field.key]}${field.unit ?? ''}`}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={values[field.key]}
                        onChange={(event): void =>
                            update(field.key, Number(event.currentTarget.value))
                        }
                        className="h-8 min-w-0 flex-1 cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-focus"
                    />
                    <output
                        htmlFor={id}
                        className="w-14 shrink-0 text-right text-body tabular-nums text-brand"
                    >
                        {values[field.key]}
                        {field.unit}
                    </output>
                </div>
            ) : null}
        </div>
    )
}
