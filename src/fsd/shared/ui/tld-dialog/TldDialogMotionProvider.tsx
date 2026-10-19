'use client'

import { createContext, useContext } from 'react'
import type { ReactElement, ReactNode } from 'react'

const motionContext = createContext(false)

/** 仅为指定业务树及其嵌套Portal启用统一对话框动画。 */
export function TldDialogMotionProvider({
    children,
}: {
    readonly children: ReactNode
}): ReactElement {
    return <motionContext.Provider value>{children}</motionContext.Provider>
}

export function useTldDialogMotionEnabled(): boolean {
    return useContext(motionContext)
}
