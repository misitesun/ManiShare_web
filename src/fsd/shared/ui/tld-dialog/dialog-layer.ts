export interface DialogLayerStack<T> {
    readonly add: (layer: T) => void
    readonly remove: (layer: T) => boolean
    readonly isTop: (layer: T) => boolean
    readonly top: () => T | undefined
    readonly layers: () => readonly T[]
}

export function createDialogLayerStack<T>(): DialogLayerStack<T> {
    const entries: T[] = []

    function add(layer: T): void {
        if (!entries.includes(layer)) entries.push(layer)
    }

    function remove(layer: T): boolean {
        const index = entries.indexOf(layer)
        if (index === -1) return false
        const wasTop = index === entries.length - 1
        entries.splice(index, 1)
        return wasTop
    }

    function isTop(layer: T): boolean {
        return entries.at(-1) === layer
    }

    function top(): T | undefined {
        return entries.at(-1)
    }

    function layers(): readonly T[] {
        return [...entries]
    }

    return { add, remove, isTop, top, layers }
}
