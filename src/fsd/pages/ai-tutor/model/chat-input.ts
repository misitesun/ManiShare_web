export interface ChatInputState {
    readonly voiceMode: boolean
    readonly draft: string
}

export type ChatInputAction =
    { readonly type: 'toggle-mode' } | { readonly type: 'edit'; readonly value: string }

export const initialChatInput: ChatInputState = { voiceMode: false, draft: '' }

export function chatInputReducer(state: ChatInputState, action: ChatInputAction): ChatInputState {
    if (action.type === 'toggle-mode') return { ...state, voiceMode: !state.voiceMode }
    return { ...state, draft: action.value }
}
