export const DESKTOP_POPOVER_HOVER_QUERY =
    '(min-width: 1280px) and (hover: hover) and (pointer: fine)'
export const POPOVER_LEAVE_DELAY = 150

interface PopoverTriggerEnvironment {
    readonly canHover: () => boolean
    readonly isOpen: () => boolean
    readonly setOpen: (open: boolean) => void
    readonly contains: (target: EventTarget | null) => boolean
    readonly hasFocusWithin: () => boolean
    readonly schedule: (callback: () => void, delay: number) => number
    readonly cancelFrame: (frame: number) => void
}

export interface PopoverTrigger {
    readonly enter: (pointerType: string) => void
    readonly leave: (pointerType: string, relatedTarget: EventTarget | null) => void
    readonly toggle: () => void
    readonly openByKeyboard: () => void
    readonly shouldFocusOnOpen: () => boolean
    readonly cancel: () => void
}

/** PC鼠标悬停与触控点击共用状态，跨越触发器／Portal间隙时可取消延迟关闭。 */
export function createPopoverTrigger(environment: PopoverTriggerEnvironment): PopoverTrigger {
    let openedByHover = false
    let pending: number | null = null
    let revision = 0
    function cancel(): void {
        revision += 1
        if (pending !== null) environment.cancelFrame(pending)
        pending = null
    }
    function enter(pointerType: string): void {
        cancel()
        if (!environment.canHover() || pointerType !== 'mouse') return
        if (!environment.isOpen()) {
            openedByHover = true
            environment.setOpen(true)
        }
    }
    function leave(pointerType: string, relatedTarget: EventTarget | null): void {
        if (
            !environment.canHover() ||
            pointerType !== 'mouse' ||
            environment.contains(relatedTarget)
        )
            return
        cancel()
        const current = revision
        pending = environment.schedule((): void => {
            if (current !== revision) return
            pending = null
            if (!environment.hasFocusWithin()) environment.setOpen(false)
        }, POPOVER_LEAVE_DELAY)
    }
    function toggle(): void {
        cancel()
        openedByHover = false
        environment.setOpen(!environment.isOpen())
    }
    function openByKeyboard(): void {
        cancel()
        openedByHover = false
        environment.setOpen(true)
    }
    return {
        enter,
        leave,
        toggle,
        openByKeyboard,
        cancel,
        shouldFocusOnOpen: (): boolean => !openedByHover,
    }
}
