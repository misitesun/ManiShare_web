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

interface DialogBackdropPointer {
    readonly target: EventTarget | null
    readonly currentTarget: EventTarget | null
    preventDefault(): void
}

/** 关闭前取消遮罩的默认聚焦，避免浏览器把已恢复的入口焦点移到body。 */
export function dismissTldDialogBackdrop(
    event: DialogBackdropPointer,
    policy: TldDialogDismissPolicy,
    onDismiss: () => void,
): boolean {
    if (event.target !== event.currentTarget || !canDismissTldDialog('backdrop', policy))
        return false
    event.preventDefault()
    onDismiss()
    return true
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
