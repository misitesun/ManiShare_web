import type { ReactElement, ReactNode } from 'react'
import { AppShell } from '../../fsd/app/router/AppShell'
export default function Layout({ children }: { readonly children: ReactNode }): ReactElement {
    return <AppShell>{children}</AppShell>
}
