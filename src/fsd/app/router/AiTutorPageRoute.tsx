'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { AiTutorPage } from '../../pages/ai-tutor'
import { aiTutorChatPath } from '../config/routes'
export function AiTutorPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <AiTutorPage chatPath={aiTutorChatPath} />
        </Suspense>
    )
}
