'use client'
import type { ReactElement, ReactNode } from 'react'
import { AppLayout } from '../../widgets/app-layout'
import { footerNavigationItem, navigationItems, utilityItems } from '../config/navigation'
import { routePaths } from '../config/routes'
export function AppShell({ children }: { readonly children: ReactNode }): ReactElement {
    return (
        <AppLayout
            footerNavigationItem={footerNavigationItem}
            navigationItems={navigationItems}
            utilityItems={utilityItems}
            searchPath={routePaths.courseSearch}
            settingsPath={routePaths.settings}
        >
            {children}
        </AppLayout>
    )
}
