import { getDraftPanelGeometry } from './practice-draft'
import type { DraftPanelGeometry, DraftViewport } from './practice-draft'

/** 猜词题的页内语境与图片，不要求其他单词模式具有这些字段。 */
export interface GuessWordContent {
    readonly before: string
    readonly after: string
    readonly scene: string
    readonly image: string
}

export interface GuessReadingScrollBounds {
    readonly scrollTop: number
    readonly scrollHeight: number
    readonly viewportTop: number
    readonly viewportHeight: number
    readonly rowTop: number
    readonly rowBottom: number
}

/** 仅将不可见的活动行收进列表视口，不改变已完整可见行的位置或页面滚动。 */
export function getGuessReadingScrollTop(bounds: GuessReadingScrollBounds): number {
    const bottom = bounds.viewportTop + bounds.viewportHeight
    const offset =
        bounds.rowTop < bounds.viewportTop
            ? bounds.rowTop - bounds.viewportTop
            : bounds.rowBottom > bottom
              ? bounds.rowBottom - bottom
              : 0
    return Math.max(
        0,
        Math.min(bounds.scrollTop + offset, bounds.scrollHeight - bounds.viewportHeight),
    )
}

/** 固定使用草稿默认弹出位置；答案保持独立尺寸，短屏内部滚动并预留底栏。 */
export function getGuessAnswerGeometry(viewport: DraftViewport): DraftPanelGeometry {
    const draft = getDraftPanelGeometry(viewport)
    const availableHeight = Number.isFinite(viewport.height)
        ? Math.max(0, viewport.height - 132)
        : 0
    return {
        x: draft.x,
        y: draft.y,
        width: Math.min(360, draft.width),
        height: Math.min(394, availableHeight),
    }
}
