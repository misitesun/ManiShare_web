export function isPathActive(pathname: string, to: string | undefined, end = false): boolean {
    if (to === undefined) return false
    const current = pathname.replace(/\/+$/, '') || '/'
    const target = to.replace(/\/+$/, '') || '/'
    if (end || target === '/') return current === target
    return current === target || current.startsWith(target + '/')
}
