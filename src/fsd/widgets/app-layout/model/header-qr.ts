export type HeaderQrAction = 'club-qr' | 'service-qr' | 'play-qr'

export interface HeaderQrCopy {
    readonly title: string
    readonly description: string
}

export const headerQrCopy: Readonly<Record<HeaderQrAction, HeaderQrCopy>> = {
    'club-qr': { title: '玩家俱乐部', description: '加入玩家打卡群' },
    'service-qr': { title: '客服咨询', description: '微信扫一扫咨询客服' },
    'play-qr': { title: '玩法介绍', description: '微信扫一扫查看' },
}

export function isHeaderQrAction(value: string | undefined): value is HeaderQrAction {
    return value === 'club-qr' || value === 'service-qr' || value === 'play-qr'
}

export interface HeaderQrAnchor {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly bottom: number
}

export interface HeaderQrPosition {
    readonly left: number
    readonly top: number
    readonly below: boolean
}

export function getHeaderQrPosition(
    anchor: HeaderQrAnchor,
    viewportWidth: number,
    viewportHeight: number,
): HeaderQrPosition {
    const below = anchor.bottom + 8 + 147 <= viewportHeight - 8
    return {
        left: Math.max(8, Math.min(anchor.left + anchor.width / 2 - 59, viewportWidth - 126)),
        top: Math.max(8, below ? anchor.bottom + 8 : anchor.top - 155),
        below,
    }
}
