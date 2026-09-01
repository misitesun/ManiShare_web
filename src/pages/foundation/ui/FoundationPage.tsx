import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

const capabilityKeys = ['responsive', 'themes', 'architecture'] as const

export function FoundationPage(): ReactElement {
  const { t } = useTranslation()

  return (
    <section className="mx-auto w-full max-w-[96rem] px-4 py-6 md:px-6 md:py-8 xl:px-8 xl:py-10">
      <div className="overflow-hidden rounded-panel border border-subtle bg-surface shadow-panel">
        <div className="bg-linear-to-r from-brand-start to-brand-end p-px">
          <div className="rounded-[calc(var(--radius-panel)-1px)] bg-surface px-5 py-8 md:px-8 md:py-10 xl:px-10 xl:py-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{t('foundation.eyebrow')}</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-primary md:text-4xl xl:text-5xl">
              {t('foundation.title')}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary md:text-base">
              {t('foundation.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:grid-cols-2 xl:grid-cols-3">
        {capabilityKeys.map((key) => (
          <article key={key} className="rounded-panel border border-subtle bg-surface p-5 md:p-6">
            <span aria-hidden="true" className="block h-1.5 w-12 rounded-full bg-linear-to-r from-brand-start to-brand-end" />
            <h2 className="mt-5 text-lg font-bold text-primary">{t(`foundation.capabilities.${key}.title`)}</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">{t(`foundation.capabilities.${key}.description`)}</p>
          </article>
        ))}
      </div>

      <aside className="mt-4 rounded-panel border border-dashed border-strong bg-surface-raised p-5 md:mt-6 md:p-6">
        <h2 className="text-sm font-bold text-primary">{t('foundation.scope.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-secondary">{t('foundation.scope.description')}</p>
      </aside>
    </section>
  )
}
