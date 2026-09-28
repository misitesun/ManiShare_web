'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { KnowledgeGapsPage } from '../../pages/knowledge-gaps'

export function KnowledgeGapsPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <KnowledgeGapsPage />
        </Suspense>
    )
}
