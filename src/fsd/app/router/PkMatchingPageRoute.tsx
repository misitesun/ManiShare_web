'use client'

import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { PkMatchingPage } from '../../pages/pk-arena'
import { routePaths } from '../config/routes'

export function PkMatchingPageRoute(): ReactElement {
    const router = useRouter()
    return (
        <PkMatchingPage
            onCancel={(): void => router.push(routePaths.pkArena)}
            onStart={(): void => router.push(routePaths.pkLoading)}
        />
    )
}
