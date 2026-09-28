export type PlaybackRate = '0.8' | '1' | '1.2'

export type TutorLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced'

export interface ChatSettingsState {
    readonly blindListening: boolean
    readonly feedback: boolean
    readonly level: TutorLevel
    readonly playbackRate: PlaybackRate
    readonly translation: boolean
}

export type ChatSettingsAction =
    | { readonly type: 'toggle-blind-listening' }
    | { readonly type: 'toggle-feedback' }
    | { readonly type: 'toggle-translation' }
    | { readonly type: 'set-level'; readonly value: TutorLevel }
    | { readonly type: 'set-playback-rate'; readonly value: PlaybackRate }

export const initialChatSettings: ChatSettingsState = {
    blindListening: true,
    feedback: true,
    level: 'beginner',
    playbackRate: '0.8',
    translation: false,
}

export function chatSettingsReducer(
    state: ChatSettingsState,
    action: ChatSettingsAction,
): ChatSettingsState {
    switch (action.type) {
        case 'toggle-blind-listening':
            return { ...state, blindListening: !state.blindListening }
        case 'toggle-feedback':
            return { ...state, feedback: !state.feedback }
        case 'toggle-translation':
            return { ...state, translation: !state.translation }
        case 'set-level':
            return { ...state, level: action.value }
        case 'set-playback-rate':
            return { ...state, playbackRate: action.value }
    }
}
