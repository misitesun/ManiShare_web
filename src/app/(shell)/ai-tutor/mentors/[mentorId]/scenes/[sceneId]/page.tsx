import type { ReactElement } from 'react'
import { AiTutorChatPageRoute } from '../../../../../../../fsd/app/router/AiTutorChatPageRoute'
import { getAiTutorChatParams } from '../../../../../../../fsd/pages/ai-tutor'
export const dynamicParams = false
export const generateStaticParams = getAiTutorChatParams
export default async function Page({
    params,
}: {
    readonly params: Promise<{ readonly mentorId: string; readonly sceneId: string }>
}): Promise<ReactElement> {
    const { mentorId, sceneId } = await params
    return <AiTutorChatPageRoute mentorId={mentorId} sceneId={sceneId} />
}
