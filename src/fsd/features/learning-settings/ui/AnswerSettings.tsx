import type { ReactElement } from 'react'
import { preferenceGroups } from '../model/preferences'
import { SettingControl, SettingsSection } from './SettingControls'
import type { PreferenceControlsProps } from './SettingControls'

export function AnswerSettings({ values, update }: PreferenceControlsProps): ReactElement {
    return (
        <div className="w-full min-w-0 max-w-[780px]">
            <SettingsSection title="答题">
                {preferenceGroups.answer
                    .flatMap((group) => group.fields)
                    .map((field) => (
                        <SettingControl
                            key={field.key}
                            field={field}
                            values={values}
                            update={update}
                        />
                    ))}
            </SettingsSection>
        </div>
    )
}
