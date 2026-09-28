'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { LoginPage } from '../../pages/login'

export function LoginPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <LoginPage />
        </Suspense>
    )
}
