import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { sharedConfig } from '../../../shared/config'
import { LanguageSwitcher } from '../../../shared/ui/language-switcher'
import { ThemeSwitcher } from '../../../shared/ui/theme-switcher'

export interface AppNavigationItem {
  readonly labelKey: string
  readonly to: string
  readonly end?: boolean
}

export interface AppLayoutProps {
  readonly navigationItems: readonly AppNavigationItem[]
}

export function AppLayout({ navigationItems }: AppLayoutProps): ReactElement {
  const { t } = useTranslation()
  const navigationId = useId()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const closeNavigation = useCallback((): void => {
    triggerButtonRef.current?.focus()
    setIsNavigationOpen(false)
  }, [])
  const openNavigation = useCallback((): void => {
    setIsNavigationOpen(true)
  }, [])
  const navigationClassName = isNavigationOpen
    ? 'fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,86vw)] translate-x-0 visible flex-col border-r border-subtle bg-sidebar shadow-drawer transition-transform duration-200 xl:sticky xl:top-0 xl:z-20 xl:w-64 xl:translate-x-0 xl:visible xl:shadow-none'
    : 'fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,86vw)] -translate-x-full invisible flex-col border-r border-subtle bg-sidebar shadow-drawer transition-transform duration-200 xl:sticky xl:top-0 xl:z-20 xl:w-64 xl:translate-x-0 xl:visible xl:shadow-none'

  useEffect(() => {
    if (!isNavigationOpen) return undefined

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeNavigation()
    }

    const focusFrame = window.requestAnimationFrame((): void => closeButtonRef.current?.focus())
    window.addEventListener('keydown', closeOnEscape)
    return (): void => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeNavigation, isNavigationOpen])

  return (
    <div className="min-h-dvh bg-canvas text-primary xl:grid xl:grid-cols-[16rem_minmax(0,1fr)]">
      {isNavigationOpen ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('layout.closeNavigation')}
          className="fixed inset-0 z-40 bg-overlay xl:hidden"
          onClick={closeNavigation}
        />
      ) : null}

      <aside
        id={navigationId}
        className={navigationClassName}
      >
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-subtle px-4">
          <Link
            aria-label={t('layout.homeLabel', { appName: sharedConfig.application.name })}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl"
            to="/"
            onClick={(): void => setIsNavigationOpen(false)}
          >
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-start to-brand-end text-lg font-black text-inverse">
              E
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-primary">{sharedConfig.application.name}</span>
              <span className="block truncate text-xs text-muted">{t('layout.productType')}</span>
            </span>
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={t('layout.closeNavigation')}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-subtle text-secondary transition-colors hover:bg-surface-hover hover:text-primary xl:hidden"
            onClick={closeNavigation}
          >
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <nav aria-label={t('layout.mainNavigation')} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }): string => (
                isActive
                  ? 'flex min-h-12 items-center gap-3 rounded-xl bg-linear-to-r from-brand-start to-brand-end px-4 text-sm font-semibold text-inverse shadow-panel'
                  : 'flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary'
              )}
              end={item.end ?? false}
              to={item.to}
              onClick={(): void => setIsNavigationOpen(false)}
            >
              <span aria-hidden="true" className="size-2 rounded-full bg-current opacity-75" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-subtle p-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] xl:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t('layout.interfaceSettings')}</p>
          <div className="flex flex-wrap gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </aside>

      <div className="min-w-0 xl:col-start-2">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-subtle bg-canvas/90 px-4 backdrop-blur-md md:px-6 xl:min-h-20 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={triggerButtonRef}
              type="button"
              aria-controls={navigationId}
              aria-expanded={isNavigationOpen}
              aria-label={t('layout.openNavigation')}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-subtle bg-surface text-secondary transition-colors hover:bg-surface-hover hover:text-primary xl:hidden"
              onClick={openNavigation}
            >
              <span aria-hidden="true" className="grid gap-1">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary md:text-base">{t('layout.framework')}</p>
              <p className="hidden truncate text-xs text-muted sm:block">{t('layout.rendererScope')}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-secondary md:inline-flex">
              {t('layout.p0Status')}
            </span>
            <div className="hidden items-center gap-2 xl:flex">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
