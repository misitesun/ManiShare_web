'use client'
import type { ReactElement, ReactNode } from 'react'
import { ChatSessionProvider } from '../../pages/ai-tutor'
export function AiTutorChatSession({ children }: { readonly children: ReactNode }): ReactElement {
    return <ChatSessionProvider>{children}</ChatSessionProvider>
}
