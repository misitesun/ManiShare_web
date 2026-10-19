export interface DraftPosition {
    readonly x: number
    readonly y: number
}

export interface DraftViewport {
    readonly width: number
    readonly height: number
    readonly offsetX?: number
    readonly offsetY?: number
}

export interface DraftPanelGeometry extends DraftPosition {
    readonly width: number
    readonly height: number
}

export interface PracticeDraft {
    readonly text: string
    readonly savedText: string
}

export type PracticeDraftMemory = Readonly<Record<string, PracticeDraft>>

export type PracticeDraftAction =
    | { readonly type: 'edit'; readonly text: string }
    | { readonly type: 'clear' }
    | { readonly type: 'save' }

const emptyDraft: PracticeDraft = { text: '', savedText: '' }

function safeDimension(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

function clampPosition(value: number, fallback: number, lower: number, upper: number): number {
    return Math.min(Math.max(lower, Number.isFinite(value) ? value : fallback), upper)
}

function addViewportOffset(value: number, offset: number): number {
    return Math.min(Number.MAX_VALUE, value + offset)
}

/** 使用独立宽高边界重排，不按比例缩放草稿内容；拖动与窗口变化共用同一界限。 */
export function getDraftPanelGeometry(
    viewport: DraftViewport,
    position?: DraftPosition,
): DraftPanelGeometry {
    const viewportWidth = safeDimension(viewport.width)
    const viewportHeight = safeDimension(viewport.height)
    const offsetX = safeDimension(viewport.offsetX ?? 0)
    const offsetY = safeDimension(viewport.offsetY ?? 0)
    // 极小视口无法提供两侧各12px时，将边距缩至视口的一半，避免负尺寸和越界。
    const horizontalInset = Math.min(12, viewportWidth / 2)
    const verticalInset = Math.min(12, viewportHeight / 2)
    const width = Math.min(374, Math.max(0, viewportWidth - horizontalInset * 2))
    const height = Math.min(703, Math.max(0, viewportHeight - verticalInset * 2))
    const localMaximumX = Math.max(horizontalInset, viewportWidth - width - horizontalInset)
    const localMaximumY = Math.max(verticalInset, viewportHeight - height - verticalInset)
    const minimumX = addViewportOffset(horizontalInset, offsetX)
    const minimumY = addViewportOffset(verticalInset, offsetY)
    const maximumX = addViewportOffset(localMaximumX, offsetX)
    const maximumY = addViewportOffset(localMaximumY, offsetY)
    const defaultX = addViewportOffset(
        viewportWidth >= 1920 ? viewportWidth - 404.81 : localMaximumX,
        offsetX,
    )
    const defaultY = addViewportOffset(Math.min(198, localMaximumY), offsetY)

    return {
        x: clampPosition(position?.x ?? defaultX, defaultX, minimumX, maximumX),
        y: clampPosition(position?.y ?? defaultY, defaultY, minimumY, maximumY),
        width,
        height,
    }
}

export function getPracticeDraft(memory: PracticeDraftMemory, scope: string): PracticeDraft {
    return Object.hasOwn(memory, scope) ? (memory[scope] ?? emptyDraft) : emptyDraft
}

/** 草稿按整章scope存活于页面内存；清空仅编辑，保存才提交savedText。 */
export function reducePracticeDrafts(
    memory: PracticeDraftMemory,
    scope: string,
    action: PracticeDraftAction,
): PracticeDraftMemory {
    const current = getPracticeDraft(memory, scope)
    const next: PracticeDraft =
        action.type === 'save'
            ? { text: current.text, savedText: current.text }
            : { text: action.type === 'clear' ? '' : action.text, savedText: current.savedText }
    if (next.text === current.text && next.savedText === current.savedText) return memory
    return { ...memory, [scope]: next }
}
