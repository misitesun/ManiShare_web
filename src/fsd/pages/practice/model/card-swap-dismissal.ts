interface CardSwapPendingDismiss {
    readonly index: number
    readonly onComplete: () => void
    readonly onCancel: (() => void) | undefined
}

export interface CardSwapDismissal {
    readonly pending: () => CardSwapPendingDismiss | null
    readonly begin: (index: number, onComplete: () => void, onCancel?: () => void) => boolean
    /** 先清理待提交动作，再交出本次唯一完成回调，允许同步更新或reduced-motion。 */
    readonly take: (index: number) => (() => void) | null
    /** 先清理动作，再交出唯一取消回调；卸载只废弃返回值，不触发父级更新。 */
    readonly cancel: () => (() => void) | null
}

/** 只管理专用退场的单次提交与取消，不承载位姿、题序或动画时钟。 */
export function createCardSwapDismissal(): CardSwapDismissal {
    let pendingDismiss: CardSwapPendingDismiss | null = null
    return {
        pending: (): CardSwapPendingDismiss | null => pendingDismiss,
        begin(index, onComplete, onCancel): boolean {
            if (pendingDismiss !== null || !Number.isInteger(index) || index < 0) return false
            pendingDismiss = { index, onComplete, onCancel }
            return true
        },
        take(index): (() => void) | null {
            if (pendingDismiss?.index !== index) return null
            const complete = pendingDismiss.onComplete
            pendingDismiss = null
            return complete
        },
        cancel(): (() => void) | null {
            const cancel = pendingDismiss?.onCancel ?? null
            pendingDismiss = null
            return cancel
        },
    }
}
