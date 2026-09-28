'use client'

import { createContext, useContext } from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { ChatInputAction, ChatInputState } from './chat-input'
interface ChatScrollPositions {
    sceneTop: number
    sceneLeft: number
    messagesTop: number
}
interface ChatSession {
    readonly input: ChatInputState
    readonly dispatchInput: Dispatch<ChatInputAction>
    readonly settingsOpen: boolean
    readonly setSettingsOpen: Dispatch<SetStateAction<boolean>>
    readonly scrollPositions: RefObject<ChatScrollPositions>
}
export const ChatSessionContext = createContext<ChatSession | null>(null)
export function useChatSession(): ChatSession {
    const session = useContext(ChatSessionContext)
    if (session === null) throw new Error('AI chat requires its route-scoped session provider')
    return session
}
