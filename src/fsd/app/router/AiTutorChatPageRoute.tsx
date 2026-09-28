'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { AiTutorChatPage } from '../../pages/ai-tutor'
import { routePaths, aiTutorChatPath } from '../config/routes'
export function AiTutorChatPageRoute({
    mentorId,
    sceneId,
}: {
    readonly mentorId: string
    readonly sceneId: string
}): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <AiTutorChatPage
                mentorId={mentorId}
                sceneId={sceneId}
                backPath={routePaths.aiTutor}
                chatPath={aiTutorChatPath}
            />
        </Suspense>
    )
}
