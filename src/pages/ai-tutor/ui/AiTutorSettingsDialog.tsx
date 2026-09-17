import { useReducer, type ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import {
    chatSettingsReducer,
    initialChatSettings,
    type PlaybackRate,
    type TutorLevel,
} from '../model/chat-settings'

interface AiTutorSettingsDialogProps {
    readonly onOpenChange: (open: boolean) => void
    readonly open: boolean
}

interface ChoiceOption<Value extends string> {
    readonly label: string
    readonly value: Value
}

interface ChoiceGroupProps<Value extends string> {
    readonly label: string
    readonly name: string
    readonly onChange: (value: Value) => void
    readonly options: readonly ChoiceOption<Value>[]
    readonly value: Value
}

const playbackRateOptions = [
    { label: '.8x', value: '0.8' },
    { label: '1x', value: '1' },
    { label: '1.2x', value: '1.2' },
] as const satisfies readonly ChoiceOption<PlaybackRate>[]

const levelOptions = [
    { label: '入门', value: 'beginner' },
    { label: '初级', value: 'elementary' },
    { label: '中级', value: 'intermediate' },
    { label: '高级', value: 'advanced' },
] as const satisfies readonly ChoiceOption<TutorLevel>[]

function ChoiceGroup<Value extends string>({
    label,
    name,
    onChange,
    options,
    value,
}: ChoiceGroupProps<Value>): ReactElement {
    return (
        <fieldset className="flex min-w-0 flex-wrap items-center gap-x-3">
            <legend className="sr-only">{label}</legend>
            <span aria-hidden="true" className="text-card-title text-primary">
                {label}
            </span>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                {options.map((option) => {
                    const checked = option.value === value
                    return (
                        <div key={option.value} className="w-fit">
                            <TldSelection
                                label={`${label}：${option.label}`}
                                type="radio"
                                name={name}
                                value={option.value}
                                checked={checked}
                                layout="inline"
                                onCheckedChange={(nextChecked): void => {
                                    if (nextChecked) onChange(option.value)
                                }}
                            >
                                {option.label}
                            </TldSelection>
                        </div>
                    )
                })}
            </div>
        </fieldset>
    )
}

export function AiTutorSettingsDialog({
    onOpenChange,
    open,
}: AiTutorSettingsDialogProps): ReactElement | null {
    const [settings, dispatch] = useReducer(chatSettingsReducer, initialChatSettings)

    return (
        <TldDialog
            open={open}
            onOpenChange={onOpenChange}
            title="对话设置"
            size="medium"
            showHeader={false}
            showCancelButton={false}
            showConfirmButton={false}
        >
            <div className="space-y-2 pt-4 md:space-y-5 md:pt-5">
                <TldSwitch
                    label="盲听"
                    checked={settings.blindListening}
                    onCheckedChange={(): void => dispatch({ type: 'toggle-blind-listening' })}
                />
                <TldSwitch
                    label="翻译"
                    checked={settings.translation}
                    onCheckedChange={(): void => dispatch({ type: 'toggle-translation' })}
                />
                <ChoiceGroup
                    label="语速"
                    name="ai-tutor-playback-rate"
                    options={playbackRateOptions}
                    value={settings.playbackRate}
                    onChange={(value): void => dispatch({ type: 'set-playback-rate', value })}
                />
                <ChoiceGroup
                    label="阶级"
                    name="ai-tutor-level"
                    options={levelOptions}
                    value={settings.level}
                    onChange={(value): void => dispatch({ type: 'set-level', value })}
                />
                <TldSwitch
                    label="反馈"
                    checked={settings.feedback}
                    onCheckedChange={(): void => dispatch({ type: 'toggle-feedback' })}
                />
            </div>
        </TldDialog>
    )
}
