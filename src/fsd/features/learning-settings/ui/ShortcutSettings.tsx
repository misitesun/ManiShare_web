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
        if (event.ctrlKey) {
            event.preventDefault()
            setCaptureError('练习快捷键不支持 Ctrl 组合，请改用 Shift 组合。')
            return
        }
        if (event.key === 'Enter') {
            event.preventDefault()
            confirm()
            return
        }
        event.preventDefault()
        const captured = captureShortcut(event)
        if (captured === null) {
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return
            setCaptureError('不能使用单个字母；请按下 Shift 组合键或其他有效组合键。')
            return
        }
        setCaptureError(null)
        setDraft(captured)
    }

    return (
        <SettingsSection title="练习快捷键">
            <div className="space-y-2 text-caption leading-relaxed text-muted">
                <p>不能使用单个字母作为自定义快捷键。</p>
                <p>练习快捷键使用 Shift 组合；不支持 Ctrl 组合。</p>
                <p>支持 Shift + 字母，以及 Alt、Meta 组合和功能键。</p>
                <p>Enter、空格、V、Esc 和上下方向键用于练习主流程或面板显隐。</p>
                <p>上一题、下一题快捷键与底栏两端按钮执行相同切题操作。</p>
                <p>
                    作答输入区优先保留复制、粘贴、全选、撤销等编辑组合；同名自定义键在输入区外生效。
                </p>
                <p>
                    Shift + 字符（包括大写字母）在作答输入区保留原生输入，在输入区外执行练习动作。
                </p>
            </div>
            {shortcutFields.map((field) => {
                const fieldError = shortcutError(values, field.key, values[field.key])
                return (
                    <div
                        key={field.key}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface p-4"
                    >
                        <div className="min-w-0 flex-1">
                            <span className="text-body text-primary">{field.label}</span>
                            {fieldError && (
                                <p role="alert" className="mt-1 text-caption text-danger">
                                    {fieldError} 此快捷键暂不生效，请重新设置。
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
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
                )
            })}
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
