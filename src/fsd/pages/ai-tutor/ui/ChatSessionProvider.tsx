'use client'
import { useReducer, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { ChatSessionContext } from '../model/chat-session'
import { chatInputReducer, initialChatInput } from '../model/chat-input'
export function ChatSessionProvider({ children }: { readonly children: ReactNode }): ReactElement {
    const [input, dispatchInput] = useReducer(chatInputReducer, initialChatInput)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const scrollPositions = useRef({
        sceneTop: 0,
        sceneLeft: 0,
        messagesTop: 0,
    })
    return (
        <ChatSessionContext.Provider
            value={{ input, dispatchInput, settingsOpen, setSettingsOpen, scrollPositions }}
        >
            {children}
        </ChatSessionContext.Provider>
    )
}
