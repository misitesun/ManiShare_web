'use client'

import type { ReactElement } from 'react'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import { getAdditionalToolbarRows } from '../model/additional-toolbar-options'
import type {
    AdditionalToolbarFamily,
    AdditionalToolbarOptions,
} from '../model/additional-toolbar-options'
import type { PracticeMode } from '../model/practice-demo'
import { PracticeModeToolbar } from './PracticeModeToolbar'

interface AdditionalPracticeToolbarProps {
    readonly family: AdditionalToolbarFamily
    readonly mode: PracticeMode
    readonly values: AdditionalToolbarOptions
    readonly onChange: (values: AdditionalToolbarOptions) => void
    readonly onNotice: (message: string) => void
    readonly answerVisible: boolean
}

/** 其余内容族只提供自身的模式配置；音标的自然拼读是常驻开关，不进入设置浮层。 */
export function AdditionalPracticeToolbar({
    family,
    mode,
    values,
    onChange,
    onNotice,
    answerVisible,
}: AdditionalPracticeToolbarProps): ReactElement {
    const rows = getAdditionalToolbarRows(family, mode, answerVisible)
    return (
        <PracticeModeToolbar
            family={family}
            reference={
                (family === 'video' || family === 'picture') && mode === 'listen'
                    ? 'listening'
                    : 'default'
            }
            rows={rows}
            values={values}
            onValueChange={(row, checked): void => onChange({ ...values, [row]: checked })}
            onNotice={onNotice}
            inlineControl={
                family === 'phonetics' ? (
                    <div
                        data-practice-inline="natural-phonics"
                        className="flex h-10 w-[88px] shrink-0 items-center justify-center rounded-[4px] bg-practice-control-surface xl:h-[26px]"
                    >
                        <TldSwitch
                            size="practice"
                            label="自然拼读"
                            checked={values.naturalPhonics}
                            onCheckedChange={(naturalPhonics): void =>
                                onChange({ ...values, naturalPhonics })
                            }
                        />
                    </div>
                ) : null
            }
        />
    )
}
