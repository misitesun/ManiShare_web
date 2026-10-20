import { isTrustedRenderer } from './renderer-contract.js'

/** 桌面只把可信练习窗口的欧路词条GET外链交给系统浏览器；不开放任意外站。 */
export function getDictionaryNavigationTarget(
    url: string,
    sourceUrl: string,
    developmentUrl?: string,
    hasPostBody = false,
): string | null {
    if (hasPostBody || !isTrustedRenderer(sourceUrl, developmentUrl)) return null
    try {
        const target = new URL(url)
        if (
            target.origin !== 'https://dict.eudic.net' ||
            target.username ||
            target.password ||
            target.search ||
            target.hash ||
            !/^\/dicts\/en\/[^/]+$/u.test(target.pathname)
        )
            return null
        const word = decodeURIComponent(target.pathname.slice('/dicts/en/'.length))
        if (!word.trim() || word !== word.trim() || /[\u0000-\u001f\u007f]/u.test(word)) return null
        return target.href
    } catch {
        return null
    }
}
