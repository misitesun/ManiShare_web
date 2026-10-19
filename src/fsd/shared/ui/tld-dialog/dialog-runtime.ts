import { createDialogLayerStack } from './dialog-layer'

interface DialogIsolationElement {
    inert: boolean
    readonly style: { zIndex: string }
}

interface DialogIsolationHost<T> {
    readonly elements: () => readonly T[]
    readonly getOverflow: () => string
    readonly setOverflow: (value: string) => void
    readonly contains: (container: T, target: T) => boolean
}

interface DialogLayerRuntime<T> {
    readonly register: (layer: T) => () => boolean
    readonly isTop: (layer: T) => boolean
    readonly canRestoreFocus: (element: T) => boolean
}

export function createDialogLayerRuntime<T extends DialogIsolationElement>(
    host: DialogIsolationHost<T>,
): DialogLayerRuntime<T> {
    const stack = createDialogLayerStack<T>()
    const originalInert = new Map<T, boolean>()
    let originalOverflow: string | null = null

    function updateIsolation(): void {
        const top = stack.top()
        if (top === undefined) {
            for (const [element, inert] of originalInert) element.inert = inert
            originalInert.clear()
            if (originalOverflow !== null) host.setOverflow(originalOverflow)
            originalOverflow = null
            return
        }

        for (const element of host.elements()) {
            if (!originalInert.has(element)) originalInert.set(element, element.inert)
            element.inert = element !== top
        }
        stack.layers().forEach((layer, index): void => {
            layer.style.zIndex = String(60 + index)
        })
    }

    function register(layer: T): () => boolean {
        if (stack.top() === undefined) {
            originalOverflow = host.getOverflow()
            host.setOverflow('hidden')
        }
        stack.add(layer)
        updateIsolation()

        return (): boolean => {
            const wasTop = stack.remove(layer)
            updateIsolation()
            return wasTop
        }
    }

    function isTop(layer: T): boolean {
        return stack.isTop(layer)
    }

    function canRestoreFocus(element: T): boolean {
        const top = stack.top()
        return top === undefined || host.contains(top, element)
    }

    return { register, isTop, canRestoreFocus }
}

const browserRuntime = createDialogLayerRuntime<HTMLElement>({
    elements: (): HTMLElement[] =>
        Array.from(document.body.children).filter(
            (element): element is HTMLElement => element instanceof HTMLElement,
        ),
    getOverflow: (): string => document.body.style.overflow,
    setOverflow: (value): void => {
        document.body.style.overflow = value
    },
    contains: (container, target): boolean => container.contains(target),
})

export const registerDialogLayer = browserRuntime.register
export const isTopDialogLayer = browserRuntime.isTop
export const canRestoreDialogFocus = browserRuntime.canRestoreFocus
