import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import {
    contentSecurityPolicy,
    digest,
    parseCspManifest,
    resolveRendererFile,
    verifyHtmlIntegrity,
} from '../electron/renderer-contract'
import {
    createMediaResponsePlan,
    readMediaResponseBody,
    supportsMediaByteRanges,
} from '../electron/media-byte-range'
const target = process.argv[2] ?? 'production'
if (!['production', 'staging'].includes(target)) throw new Error('Invalid preview environment')
const root = resolve('dist', target)
const manifest = parseCspManifest(
    JSON.parse(readFileSync(resolve(root, '.csp-manifest.json'), 'utf8')) as unknown,
)
verifyHtmlIntegrity(root, manifest)
const port = Number(process.env.PREVIEW_PORT ?? 4173)
createServer((request, response): void => {
    const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`)
    // Canonicalize only known page directories; assets and unknown paths retain strict 404 handling.
    if (!url.pathname.endsWith('/') && !url.pathname.split('/').at(-1)?.includes('.')) {
        const slash = resolveRendererFile(
            root,
            new URL(url.pathname + '/' + url.search, url.origin).href,
        )
        if (slash.status === 200) {
            response.writeHead(308, { Location: url.pathname + '/' + url.search })
            response.end()
            return
        }
    }
    const result = resolveRendererFile(root, url.href)
    if (result.file === null || result.key === null) {
        response.writeHead(result.status, { 'Content-Type': result.contentType })
        response.end('Not found')
        return
    }
    const headers: Record<string, string> = {
        'Content-Type': result.contentType,
        'Cache-Control': result.cacheControl,
        'X-Content-Type-Options': 'nosniff',
    }
    if (
        result.status === 200 &&
        supportsMediaByteRanges(result.contentType) &&
        (request.method === 'GET' || request.method === 'HEAD')
    ) {
        const plan = createMediaResponsePlan(
            request.method,
            request.headers.range,
            statSync(result.file).size,
        )
        response.writeHead(plan.status, { ...headers, ...plan.headers })
        response.end(readMediaResponseBody(result.file, plan) ?? undefined)
        return
    }
    const body = readFileSync(result.file)
    if (result.contentType.startsWith('text/html')) {
        const entry = manifest[result.key]
        if (entry === undefined || digest(body) !== entry.digest) {
            response.writeHead(500)
            response.end('HTML integrity failure')
            return
        }
        headers['Content-Security-Policy'] = contentSecurityPolicy(entry)
    }
    response.writeHead(result.status, headers)
    response.end(body)
}).listen(port, '127.0.0.1', (): void => {
    console.log(`Static ${target} preview: http://127.0.0.1:${port}/`)
})
