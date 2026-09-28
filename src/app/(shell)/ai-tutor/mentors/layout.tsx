import type { ReactElement, ReactNode } from 'react'
import { AiTutorChatSession } from '../../../../fsd/app/router/AiTutorChatSession'
export default function Layout({ children }: { readonly children: ReactNode }): ReactElement {
    return <AiTutorChatSession>{children}</AiTutorChatSession>
}
