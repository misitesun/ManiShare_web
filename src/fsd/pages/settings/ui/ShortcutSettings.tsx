'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import { captureShortcut, shortcutError, shortcutFields } from '../model/preferences'
import type { ShortcutPreferenceKey } from '../model/preferences'
import { SettingsSection } from './SettingControls'
import type { PreferenceControlsProps } from './SettingControls'

export function ShortcutSettings({ values, update }: PreferenceControlsProps): ReactElement {
    const [editing, setEditing] = useState<ShortcutPreferenceKey | null>(null)
    const [draft, setDraft] = useState('')
    const [captureError, setCaptureError] = useState<string | null>(null)
    const error = editing === null ? null : (captureError ?? shortcutError(values, editing, draft))

    useEffect(() => {
        if (editing === null) return
        window.addEventListener('keydown', onKeyDown)
        return (): void => window.removeEventListener('keydown', onKeyDown)
    })

    function confirm(): void {
        if (editing === null || error !== null) return
        update(editing, draft)
        setEditing(null)
    }

    function onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape' || event.key === 'Tab') return
        if (
            event.target instanceof HTMLElement &&
            event.target.closest('button') &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            (event.key === 'Enter' || event.key === ' ')
        )
            return
        if (event.key === 'Enter') {
            event.preventDefault()
            confirm()
            return
        }
        event.preventDefault()
        const captured = captureShortcut(event)
        if (captured === null) {
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return
            setCaptureError('不能使用单个字母或 Shift + 字母、字符；请按下有效组合键。')
            return
        }
        setCaptureError(null)
        setDraft(captured)
    }

    return (
        <SettingsSection title="快捷键">
            <div className="space-y-2 text-caption leading-relaxed text-muted">
                <p>不能使用单个字母作为自定义快捷键。</p>
                <p>不能使用 Shift + 字母、字符此类系统级输入组合键。</p>
                <p>快捷键只保存配置，练习中的快捷操作随课程功能接入。</p>
            </div>
            {shortcutFields.map((field) => (
                <div
                    key={field.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface p-4"
                >
                    <span className="text-body text-primary">{field.label}</span>
                    <div className="flex items-center gap-3">
                        <kbd className="rounded-md border border-strong px-3 py-1 text-label text-brand">
                            {values[field.key]}
                        </kbd>
                        <TldButton
                            variant="secondary"
                            onClick={(): void => {
                                setDraft(values[field.key])
                                setCaptureError(null)
                                setEditing(field.key)
                            }}
                        >
                            编辑{field.label}
                        </TldButton>
                    </div>
                </div>
            ))}
            <TldDialog
                title="自定义快捷键"
                size="small"
                open={editing !== null}
                onOpenChange={(open): void => {
                    if (!open) setEditing(null)
                }}
                confirmDisabled={error !== null}
                closeOnConfirm={false}
                onConfirm={confirm}
            >
                <div className="space-y-4">
                    <p className="text-body text-primary">
                        请按下任意按键或组合键，回车键（Enter ⏎）确认
                    </p>
                    <div
                        role="textbox"
                        aria-label="录入快捷键"
                        aria-readonly="true"
                        tabIndex={0}
                        className="cursor-text rounded-xl border border-brand bg-surface p-6 text-center text-section-title text-brand focus-visible:outline-2 focus-visible:outline-focus"
                    >
                        {draft}
                    </div>
                    <p
                        role="status"
                        className={error ? 'text-caption text-danger' : 'text-caption text-muted'}
                    >
                        {error ?? '取消或关闭窗口将保留原来的快捷键。'}
                    </p>
                </div>
            </TldDialog>
        </SettingsSection>
    )
}
