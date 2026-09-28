'use client'
import { useEffect, type ReactElement, type ReactNode } from 'react'
import { ThemeProvider } from '../../shared/theme'
import { i18n, getInitialLanguage } from '../../shared/i18n'
import { initializePwaInstallLifecycle } from '../../shared/lib/pwa'
export function AppProviders({ children }: { readonly children: ReactNode }): ReactElement {
    useEffect(() => {
        void i18n.changeLanguage(getInitialLanguage())
        initializePwaInstallLifecycle()
    }, [])
    return <ThemeProvider>{children}</ThemeProvider>
}
