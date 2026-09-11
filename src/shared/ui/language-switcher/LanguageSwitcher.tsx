import { supportedLanguages, useAppLanguage } from '../../i18n'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

const languageLabels = { 'zh-CN': '简体中文', 'en-US': 'English' } as const

export function LanguageSwitcher(): ReactElement {
    const { language, changeLanguage } = useAppLanguage()
    const { t } = useTranslation()

    return (
        <select
            aria-label={t('layout.language')}
            className="h-10 cursor-pointer rounded-lg border border-subtle bg-surface-raised px-3 text-label text-secondary transition-colors hover:bg-surface-hover focus-visible:border-focus"
            value={language}
            onChange={(event): void => changeLanguage(event.target.value)}
        >
            {supportedLanguages.map((item) => (
                <option key={item} value={item}>
                    {languageLabels[item]}
                </option>
            ))}
        </select>
    )
}
