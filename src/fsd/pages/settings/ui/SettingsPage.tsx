'use client'

import type { ReactElement } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
    LearningSettingsEditor,
    resolveSettingsTab,
    type SettingsTab,
} from '../../../features/learning-settings'

export function SettingsPage(): ReactElement {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const activeTab = resolveSettingsTab(searchParams.get('tab'))

    function changeTab(value: SettingsTab): void {
        const query = new URLSearchParams(searchParams.toString())
        query.set('tab', value)
        router.replace(`${pathname}?${query}`, { scroll: false })
    }

    return (
        <LearningSettingsEditor activeTab={activeTab} onTabChange={changeTab} presentation="page" />
    )
}
