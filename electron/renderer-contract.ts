import { createHash } from 'node:crypto'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep, extname } from 'node:path'

export interface RendererFile {
    readonly file: string | null
    readonly key: string | null
    readonly status: number
    readonly contentType: string
    readonly cacheControl: string
}
export interface HtmlIntegrity {
    readonly digest: string
    readonly scriptHashes: readonly string[]
}
export type CspManifest = Readonly<Record<string, HtmlIntegrity>>

export function digest(content: string | Buffer): string {
    return createHash('sha256').update(content).digest('base64')
}
export function htmlIntegrity(html: string): HtmlIntegrity {
    const scriptHashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
        .filter((match) => !/\bsrc\s*=/i.test(match[1] ?? ''))
        .map((match) => `'sha256-${digest(match[2] ?? '')}'`)
    return { digest: digest(html), scriptHashes: [...new Set(scriptHashes)] }
}
export function parseCspManifest(value: unknown): CspManifest {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        throw new Error('Invalid CSP manifest')
    const manifest: Record<string, HtmlIntegrity> = {}
    for (const [key, entry] of Object.entries(value)) {
        if (
            typeof entry !== 'object' ||
            entry === null ||
            !('digest' in entry) ||
            !('scriptHashes' in entry)
        )
            throw new Error('Invalid HTML integrity entry')
        if (
            typeof entry.digest !== 'string' ||
            !Array.isArray(entry.scriptHashes) ||
            !entry.scriptHashes.every(
                (hash: unknown): boolean =>
                    typeof hash === 'string' && /^'sha256-[A-Za-z0-9+/]{43}='$/.test(hash),
            )
        )
            throw new Error('Invalid HTML integrity values')
        manifest[key] = { digest: entry.digest, scriptHashes: entry.scriptHashes }
    }
    return manifest
}
export function contentSecurityPolicy(integrity: HtmlIntegrity | undefined): string {
    return `default-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; script-src 'self' ${integrity?.scriptHashes.join(' ') ?? ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https:`
}
export function verifyHtmlIntegrity(root: string, manifest: CspManifest): void {
    for (const [key, entry] of Object.entries(manifest)) {
        if (
            !key.endsWith('.html') ||
            key.includes('\\') ||
            key.includes(':') ||
            key.split('/').some((segment) => segment === '..' || segment === '.') ||
            isAbsolute(key)
        )
            throw new Error('Invalid HTML manifest path')
        const html = readFileSync(resolve(root, key), 'utf8')
        const actual = htmlIntegrity(html)
        if (
            actual.digest !== entry.digest ||
            JSON.stringify(actual.scriptHashes) !== JSON.stringify(entry.scriptHashes)
        )
            throw new Error(`HTML/CSP integrity mismatch: ${key}`)
    }
}
function inside(root: string, candidate: string): boolean {
    const path = relative(root, candidate)
    return path === '' || (!path.startsWith('..' + sep) && path !== '..' && !isAbsolute(path))
}
export function isTrustedRenderer(url: string, developmentUrl?: string): boolean {
    try {
        const target = new URL(url)
        if (developmentUrl !== undefined) {
            const development = new URL(developmentUrl)
            return (
                development.protocol === 'http:' &&
                development.hostname === '127.0.0.1' &&
                target.origin === development.origin &&
                !target.username &&
                !target.password
            )
        }
        return (
            target.protocol === 'englishlearning:' &&
            target.hostname === 'app' &&
            !target.port &&
            !target.username &&
            !target.password
        )
    } catch {
        return false
    }
}
export function resolveRendererFile(root: string, requestUrl: string): RendererFile {
    const missing: RendererFile = {
        file: null,
        key: null,
        status: 404,
        contentType: 'text/plain; charset=utf-8',
        cacheControl: 'no-store',
    }
    let pathname: string
    try {
        pathname = decodeURIComponent(new URL(requestUrl).pathname)
    } catch {
        return { ...missing, status: 400 }
    }
    if (pathname === '/api' || pathname.startsWith('/api/')) return missing
    if (
        pathname.includes('\\') ||
        pathname.includes('\0') ||
        pathname.split('/').some((segment) => segment === '..' || segment === '.')
    )
        return { ...missing, status: 400 }
    if (pathname.split('/').some((segment) => segment.startsWith('.'))) return missing
    const key = pathname.endsWith('/') ? pathname.slice(1) + 'index.html' : pathname.slice(1)
    const realRoot = realpathSync(root)
    let candidate = resolve(realRoot, key)
    if (existsSync(candidate) && statSync(candidate).isDirectory())
        candidate = resolve(candidate, 'index.html')
    if (!inside(realRoot, candidate)) return { ...missing, status: 400 }
    let status = 200
    if (!existsSync(candidate) || !statSync(candidate).isFile()) {
        // Missing page URLs get a true 404 document. Missing assets/RSC can never receive HTML.
        if (extname(pathname) || pathname.startsWith('/_next/')) return missing
        candidate = resolve(realRoot, '404.html')
        status = 404
        if (!existsSync(candidate)) return missing
    }
    if (!inside(realRoot, realpathSync(candidate))) return { ...missing, status: 400 }
    const fileKey = relative(realRoot, candidate).split(sep).join('/')
    const extension = extname(candidate)
    const rsc =
        extension === '.txt' &&
        (fileKey.endsWith('/index.txt') ||
            fileKey === 'index.txt' ||
            fileKey.split('/').at(-1)?.startsWith('__next.'))
    const mime: Readonly<Record<string, string>> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.json': 'application/json',
        '.txt': 'text/plain; charset=utf-8',
        '.xml': 'application/xml; charset=utf-8',
        '.ico': 'image/x-icon',
    }
    return {
        file: candidate,
        key: fileKey,
        status,
        contentType: rsc ? 'text/x-component' : (mime[extension] ?? 'application/octet-stream'),
        cacheControl:
            status === 404
                ? 'no-store'
                : fileKey.startsWith('_next/static/')
                  ? 'public, max-age=31536000, immutable'
                  : 'public, max-age=0, must-revalidate',
    }
}
