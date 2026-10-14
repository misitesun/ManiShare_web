'use client'

import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { routePaths } from '../config/routes'
import { PkArenaPage } from '../../pages/pk-arena'

export function PkArenaPageRoute(): ReactElement {
    const router = useRouter()
    return <PkArenaPage onEnterMatching={(): void => router.push(routePaths.pkMatching)} />
}
