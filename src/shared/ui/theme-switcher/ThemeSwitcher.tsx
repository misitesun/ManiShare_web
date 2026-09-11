import { useRef } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { isSupportedTheme, supportedThemes } from '../../config'
import { useAppTheme, useThemeTransition } from '../../theme'

export function ThemeSwitcher(): ReactElement {
    const { t } = useTranslation()
    const { theme } = useAppTheme()
    const selectRef = useRef<HTMLSelectElement>(null)
    const transitionToTheme = useThemeTransition({ originRef: selectRef })

    return (
        <select
            ref={selectRef}
            aria-label={t('layout.theme')}
            className="h-10 cursor-pointer rounded-lg border border-subtle bg-surface-raised px-3 text-label text-secondary transition-colors hover:bg-surface-hover focus-visible:border-focus"
            value={theme}
            onChange={(event): void => {
                const nextTheme = event.target.value
                if (isSupportedTheme(nextTheme)) transitionToTheme(nextTheme)
            }}
        >
            {supportedThemes.map((item) => (
                <option key={item} value={item}>
                    {t(`theme.${item}`)}
                </option>
            ))}
        </select>
    )
}
