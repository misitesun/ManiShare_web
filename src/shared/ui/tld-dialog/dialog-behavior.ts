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
