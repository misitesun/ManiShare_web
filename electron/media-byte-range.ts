import { closeSync, openSync, readSync } from 'node:fs'

export type MediaByteRange =
    | { readonly kind: 'full'; readonly length: number }
    | {
          readonly kind: 'partial'
          readonly start: number
          readonly end: number
          readonly length: number
      }
    | { readonly kind: 'unsatisfiable' }

export interface MediaResponseByteSpan {
    readonly start: number
    readonly length: number
}

export interface MediaResponsePlan {
    readonly status: 200 | 206 | 416
    readonly headers: Readonly<Record<string, string>>
    readonly body: MediaResponseByteSpan | null
}

/** 首版只给已有本地 WAV / MP4 开启范围传输，不改变 HTML、RSC 或其他资源。 */
export function supportsMediaByteRanges(contentType: string): boolean {
    return contentType === 'audio/wav' || contentType === 'video/mp4'
}

export function resolveMediaByteRange(
    header: string | null | undefined,
    totalSize: number,
): MediaByteRange {
    if (!Number.isSafeInteger(totalSize) || totalSize < 0)
        throw new RangeError('Invalid media file size')
    if (header === null || header === undefined) return { kind: 'full', length: totalSize }
    const matched = /^bytes=(\d*)-(\d*)$/i.exec(header.trim())
    if (matched === null || totalSize === 0) return { kind: 'unsatisfiable' }
    const startValue = matched[1] ?? ''
    const endValue = matched[2] ?? ''
    if (startValue === '' && endValue === '') return { kind: 'unsatisfiable' }
    const size = BigInt(totalSize)
    let start: bigint
    let end: bigint
    if (startValue === '') {
        const suffix = BigInt(endValue)
        if (suffix === 0n) return { kind: 'unsatisfiable' }
        start = suffix >= size ? 0n : size - suffix
        end = size - 1n
    } else {
        start = BigInt(startValue)
        if (start >= size) return { kind: 'unsatisfiable' }
        const requestedEnd = endValue === '' ? size - 1n : BigInt(endValue)
        if (requestedEnd < start) return { kind: 'unsatisfiable' }
        end = requestedEnd >= size ? size - 1n : requestedEnd
    }
    return {
        kind: 'partial',
        start: Number(start),
        end: Number(end),
        length: Number(end - start + 1n),
    }
}

export function createMediaResponsePlan(
    method: 'GET' | 'HEAD',
    header: string | null | undefined,
    totalSize: number,
): MediaResponsePlan {
    const range = resolveMediaByteRange(header, totalSize)
    if (range.kind === 'unsatisfiable')
        return {
            status: 416,
            headers: {
                'Accept-Ranges': 'bytes',
                'Content-Range': `bytes */${totalSize}`,
                'Content-Length': '0',
            },
            body: null,
        }
    if (range.kind === 'partial')
        return {
            status: 206,
            headers: {
                'Accept-Ranges': 'bytes',
                'Content-Range': `bytes ${range.start}-${range.end}/${totalSize}`,
                'Content-Length': String(range.length),
            },
            body: method === 'HEAD' ? null : { start: range.start, length: range.length },
        }
    return {
        status: 200,
        headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(range.length) },
        body: method === 'HEAD' || range.length === 0 ? null : { start: 0, length: range.length },
    }
}

/** 路径须先经过 resolveRendererFile；不在这里接受或解析 URL。 */
export function readMediaResponseBody(
    file: string,
    plan: MediaResponsePlan,
): Uint8Array<ArrayBuffer> | null {
    if (plan.body === null) return null
    const content = new Uint8Array(plan.body.length)
    const descriptor = openSync(file, 'r')
    try {
        let offset = 0
        while (offset < content.byteLength) {
            const read = readSync(
                descriptor,
                content,
                offset,
                content.byteLength - offset,
                plan.body.start + offset,
            )
            if (read === 0) throw new Error('Media changed while reading its byte range')
            offset += read
        }
    } finally {
        closeSync(descriptor)
    }
    return content
}
