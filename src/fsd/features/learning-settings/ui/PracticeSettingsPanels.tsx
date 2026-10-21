'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createSoundPlayer } from '../../../shared/lib/sound-player'
import type { SoundAudio } from '../../../shared/lib/sound-player'
import { TldButton } from '../../../shared/ui/tld-button'
import { getLearningSoundPreview } from '../model/feedback-sounds'
import type { LearningSoundPreviewKind } from '../model/feedback-sounds'
import { preferenceGroups } from '../model/preferences'
import type { SettingsGroup } from '../model/preferences'
import { SettingControl, SettingsSection } from './SettingControls'
import type { PreferenceControlsProps } from './SettingControls'
import { AnimationEffectSettings } from './AnimationEffectSettings'

const soundPreviewFields: Readonly<Record<string, LearningSoundPreviewKind | undefined>> = {
    typingVolume: 'typing',
    correctVolume: 'correct',
    errorVolume: 'incorrect',
    completionVolume: 'chapterComplete',
    transitionSound: 'questionChange',
    evaluationSound: 'evaluationComplete',
}

function createPreviewAudio(): SoundAudio {
    return new Audio()
}

function SettingsFields({
    group,
    values,
    update,
    onSoundPreview,
    previewing,
}: PreferenceControlsProps & {
    group: SettingsGroup
    onSoundPreview?: (kind: LearningSoundPreviewKind) => void
    previewing?: LearningSoundPreviewKind | null
}): ReactElement {
    return (
        <div className="space-y-6">
            {group.fields.map((field) => {
                const kind = soundPreviewFields[field.key]
                const preview = kind ? getLearningSoundPreview(values, kind) : null
                return (
                    <div key={field.key}>
                        <SettingControl field={field} values={values} update={update} />
                        {kind && preview && onSoundPreview && (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <TldButton
                                    size="compact"
                                    variant="secondary"
                                    className="min-h-10 cursor-pointer disabled:cursor-not-allowed md:min-h-8"
                                    disabled={!preview.enabled || !preview.asset}
                                    aria-label={`${previewing === kind ? '停止试听' : '试听'}${preview.label}`}
                                    onClick={(): void => onSoundPreview(kind)}
                                >
                                    {previewing === kind ? '停止试听' : '试听'}
                                </TldButton>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export function SpecializedSettings({ values, update }: PreferenceControlsProps): ReactElement {
    return (
        <div className="w-full min-w-0 max-w-[780px]">
            <SettingsSection title="口语评测">
                {preferenceGroups.specialized.map((group) => (
                    <div key={group.title} className="space-y-4">
                        {group.title === '口语评测' ? null : (
                            <h3 className="text-card-title font-medium text-primary">
                                {group.title}
                            </h3>
                        )}
                        <SettingsFields group={group} values={values} update={update} />
                    </div>
                ))}
            </SettingsSection>
        </div>
    )
}

export function EffectsSettings({ values, update }: PreferenceControlsProps): ReactElement {
    const groups = preferenceGroups.effects
    const player = useMemo(() => createSoundPlayer(createPreviewAudio), [])
    const current = useRef<{ kind: LearningSoundPreviewKind; key: string } | null>(null)
    const [previewing, setPreviewing] = useState<LearningSoundPreviewKind | null>(null)
    const [status, setStatus] = useState('')
    useEffect(() => {
        function stop(): void {
            player.stop()
        }
        function stopHidden(): void {
            if (document.visibilityState !== 'visible') stop()
        }
        document.addEventListener('visibilitychange', stopHidden)
        window.addEventListener('blur', stop)
        return (): void => {
            document.removeEventListener('visibilitychange', stopHidden)
            window.removeEventListener('blur', stop)
            current.current = null
            // 清理时不向已卸载组件回报状态，Strict Mode重挂仍可复用纯控制器。
            player.stop()
        }
    }, [player])
    useEffect(() => {
        const active = current.current
        if (!active) return
        const selection = getLearningSoundPreview(values, active.kind)
        if (!selection.enabled || selection.key !== active.key) player.stop()
        else player.setVolume(selection.volume)
    }, [player, values])

    function preview(kind: LearningSoundPreviewKind): void {
        if (current.current?.kind === kind && player.isActive()) {
            player.stop()
            return
        }
        player.stop()
        const selection = getLearningSoundPreview(values, kind)
        if (!selection.enabled || !selection.asset) return
        current.current = { kind, key: selection.key }
        player.play({
            src: selection.asset.src,
            volume: selection.volume,
            onPhase(phase): void {
                if (current.current?.kind !== kind || current.current.key !== selection.key) return
                if (phase === 'starting' || phase === 'playing') {
                    setPreviewing(kind)
                    setStatus(`正在试听${selection.label}`)
                } else {
                    current.current = null
                    setPreviewing(null)
                    setStatus(
                        phase === 'blocked'
                            ? '浏览器未允许播放，请再次点击试听。'
                            : phase === 'failed'
                              ? `${selection.label}暂不可播放。`
                              : '',
                    )
                }
            },
        })
    }
    return (
        <div className="w-full min-w-0 max-w-[780px] space-y-5">
            <AnimationEffectSettings values={values} update={update} />
            <SettingsSection title="声音特效">
                {groups
                    .filter((group) => group.title !== '动画特效' && group.title !== '其它')
                    .map((group) => (
                        <section
                            key={group.title}
                            aria-label={group.title}
                            className="min-w-0 rounded-xl border border-subtle p-4 md:p-5"
                        >
                            <SettingsFields
                                group={group}
                                values={values}
                                update={update}
                                onSoundPreview={preview}
                                previewing={previewing}
                            />
                        </section>
                    ))}
            </SettingsSection>
            {groups
                .filter((group) => group.title === '其它')
                .map((group) => (
                    <SettingsSection key={group.title} title={group.title}>
                        <SettingsFields
                            group={group}
                            values={values}
                            update={update}
                            onSoundPreview={preview}
                            previewing={previewing}
                        />
                    </SettingsSection>
                ))}
            <p role="status" className="min-h-5 text-caption text-muted">
                {status}
            </p>
        </div>
    )
}
