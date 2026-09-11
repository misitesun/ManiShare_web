import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export function RouteLoading(): ReactElement {
    const { t } = useTranslation()

    return (
        <div className="grid min-h-[50dvh] place-items-center px-6 text-center text-label text-muted">
            {t('layout.loading')}
        </div>
    )
}
