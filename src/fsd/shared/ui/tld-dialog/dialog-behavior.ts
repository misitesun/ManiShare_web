export type TldDialogDismissTrigger = 'backdrop' | 'escape'

export interface TldDialogDismissPolicy {
    readonly closeOnBackdrop: boolean
    readonly closeOnEscape: boolean
}

export function canDismissTldDialog(
    trigger: TldDialogDismissTrigger,
    policy: TldDialogDismissPolicy,
): boolean {
    return trigger === 'backdrop' ? policy.closeOnBackdrop : policy.closeOnEscape
}
export type DialogFocusPosition = 'frame' | 'outside' | 'first' | 'last' | 'only' | 'inside'

export function getDialogTabTarget(
    position: DialogFocusPosition,
    backward: boolean,
    hasFocusableElements: boolean,
): 'frame' | 'first' | 'last' | null {
    if (!hasFocusableElements) return 'frame'
    if (position === 'frame' || position === 'outside' || position === 'only')
        return backward ? 'last' : 'first'
    if (backward && position === 'first') return 'last'
    if (!backward && position === 'last') return 'first'
    return null
}
