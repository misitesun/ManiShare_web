import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRouteError } from 'react-router-dom'

export function RouteErrorPage(): ReactElement {
  const error = useRouteError()
  const { t } = useTranslation()
  const detail = error instanceof Error ? error.message : t('error.unknown')

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-12 text-primary">
      <section className="w-full max-w-lg rounded-panel border border-subtle bg-surface p-6 text-center shadow-panel md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-danger">{t('error.eyebrow')}</p>
        <h1 className="mt-3 text-2xl font-bold md:text-3xl">{t('error.title')}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-secondary">{detail}</p>
        <Link className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-inverse transition-opacity hover:opacity-90" to="/">
          {t('error.backHome')}
        </Link>
      </section>
    </main>
  )
}
