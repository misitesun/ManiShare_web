export interface BrowserSnapshot {
    userAgent: string
    maxTouchPoints: number
    screenWidth: number
    screenHeight: number
    pixelRatio: number
    width: number
    height: number
    scale: number
}

export function describeBrowser(snapshot: BrowserSnapshot): readonly [string, string][] {
    const ua = snapshot.userAgent
    const os = /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua) || (/Macintosh/.test(ua) && snapshot.maxTouchPoints > 1)
          ? 'iOS / iPadOS'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Macintosh/.test(ua)
              ? 'macOS'
              : /Linux/.test(ua)
                ? 'Linux'
                : '未知系统'
    const match =
        /Edg\/([\d.]+)/.exec(ua) ??
        /Firefox\/([\d.]+)/.exec(ua) ??
        /(?:Chrome|CriOS)\/([\d.]+)/.exec(ua) ??
        /Version\/([\d.]+).*Safari/.exec(ua)
    const browser = /Edg\//.test(ua)
        ? 'Edge'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Chrome|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari/.test(ua)
              ? 'Safari'
              : '未知浏览器'
    return [
        [
            '设备类型',
            /iPhone|Android.*Mobile/.test(ua)
                ? '手机'
                : /iPad|Android/.test(ua) || (/Macintosh/.test(ua) && snapshot.maxTouchPoints > 1)
                  ? '平板'
                  : 'PC',
        ],
        ['浏览器', `${os}，${browser} ${match?.[1] ?? ''}`.trim()],
        ['浏览器标识', ua],
        [
            '触摸',
            `${snapshot.maxTouchPoints > 0 ? '支持' : '不支持'}，${snapshot.maxTouchPoints} 触点`,
        ],
        [
            '屏幕',
            `${snapshot.screenWidth}×${snapshot.screenHeight}，像素比 ${snapshot.pixelRatio}，${snapshot.screenWidth >= snapshot.screenHeight ? '横屏' : '竖屏'}`,
        ],
        ['窗口', `${snapshot.width}×${snapshot.height}，缩放 ${snapshot.scale}`],
    ]
}
