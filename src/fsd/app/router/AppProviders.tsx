'use client'
import { useEffect, type ReactElement, type ReactNode } from 'react'
import { ThemeProvider } from '../../shared/theme'
import '../../shared/i18n'
import { initializePwaInstallLifecycle } from '../../shared/lib/pwa'
export function AppProviders({ children }: { readonly children: ReactNode }): ReactElement {
    useEffect(() => {
        initializePwaInstallLifecycle()
    }, [])
    return <ThemeProvider>{children}</ThemeProvider>
}
