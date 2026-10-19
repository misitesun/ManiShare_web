import type { ReactElement } from 'react'
import { preferenceGroups } from '../model/preferences'
import type { SettingsGroup } from '../model/preferences'
import { SettingControl, SettingsSection } from './SettingControls'
import type { PreferenceControlsProps } from './SettingControls'
import { AnimationEffectSettings } from './AnimationEffectSettings'

function SettingsFields({
    group,
    values,
    update,
}: PreferenceControlsProps & { group: SettingsGroup }): ReactElement {
    return (
        <div className="space-y-6">
            {group.fields.map((field) => (
                <SettingControl key={field.key} field={field} values={values} update={update} />
            ))}
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
                            <SettingsFields group={group} values={values} update={update} />
                        </section>
                    ))}
            </SettingsSection>
            {groups
                .filter((group) => group.title === '其它')
                .map((group) => (
                    <SettingsSection key={group.title} title={group.title}>
                        <SettingsFields group={group} values={values} update={update} />
                    </SettingsSection>
                ))}
        </div>
    )
}
