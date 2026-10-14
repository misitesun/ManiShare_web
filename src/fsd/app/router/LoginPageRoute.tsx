'use client'
import { Suspense, type ReactElement } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RouteLoading } from './ui/RouteLoading'
import { LoginPage, loginViewQuery, parseLoginView } from '../../pages/login'
import type { LoginView } from '../../pages/login'

function LoginRouteContent(): ReactElement {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const view = parseLoginView(searchParams.get('view'))

    function changeView(nextView: LoginView): void {
        const query = loginViewQuery(searchParams.toString(), nextView)
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    return <LoginPage view={view} onViewChange={changeView} />
}

export function LoginPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <LoginRouteContent />
        </Suspense>
    )
}
