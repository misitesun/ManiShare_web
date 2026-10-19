import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
    createMediaResponsePlan,
    readMediaResponseBody,
    resolveMediaByteRange,
    supportsMediaByteRanges,
} from './media-byte-range'

test('媒体单区间支持首尾、开放结束和后缀，并夹紧超出文件的结束位置', (): void => {
    assert.deepEqual(resolveMediaByteRange(undefined, 10), { kind: 'full', length: 10 })
    assert.deepEqual(resolveMediaByteRange(null, 0), { kind: 'full', length: 0 })
    for (const [header, start, end] of [
        ['bytes=0-0', 0, 0],
        ['bytes=2-5', 2, 5],
        ['bytes=8-', 8, 9],
        ['bytes=2-100', 2, 9],
        ['bytes=-3', 7, 9],
        ['bytes=-100', 0, 9],
        [' bytes=0002-0004 ', 2, 4],
    ] as const)
        assert.deepEqual(resolveMediaByteRange(header, 10), {
            kind: 'partial',
            start,
            end,
            length: end - start + 1,
        })
})

test('非法、多段和不可满足区间均拒绝，不回退成看似成功的全量响应', (): void => {
    for (const header of [
        '',
        'bytes=',
        'bytes=-',
        'bytes=10-',
        'bytes=100-200',
        'bytes=8-2',
        'bytes=-0',
        'bytes=0-1,4-5',
        'bytes=0-1,',
        'items=0-2',
        'bytes=1.5-2',
        'bytes=+1-2',
        'bytes=1e1-20',
        'bytes=0 - 2',
        'bytes=0-2tail',
        'bytes=--1',
    ])
        assert.deepEqual(resolveMediaByteRange(header, 10), { kind: 'unsatisfiable' })
    assert.deepEqual(resolveMediaByteRange('bytes=0-', 0), { kind: 'unsatisfiable' })
    assert.deepEqual(resolveMediaByteRange('bytes=-1', 0), { kind: 'unsatisfiable' })
})

test('超长数字不会溢出，合法结束和后缀按真实文件长度夹紧', (): void => {
    assert.deepEqual(resolveMediaByteRange('bytes=2-99999999999999999999999999999999', 10), {
        kind: 'partial',
        start: 2,
        end: 9,
        length: 8,
    })
    assert.deepEqual(resolveMediaByteRange('bytes=-99999999999999999999999999999999', 10), {
        kind: 'partial',
        start: 0,
        end: 9,
        length: 10,
    })
    assert.deepEqual(resolveMediaByteRange('bytes=99999999999999999999999999999999-', 10), {
        kind: 'unsatisfiable',
    })
    for (const size of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])
        assert.throws(() => resolveMediaByteRange(undefined, size), RangeError)
})

test('200、206、416 的长度和范围头对应实际字节，HEAD 没有响应体', async (): Promise<void> => {
    const root = mkdtempSync(join(tmpdir(), 'learning-media-range-'))
    const file = join(root, 'sample.mp4')
    writeFileSync(file, Buffer.from('0123456789'))
    try {
        const full = createMediaResponsePlan('GET', undefined, 10)
        assert.equal(full.status, 200)
        assert.equal(full.headers['Accept-Ranges'], 'bytes')
        assert.equal(full.headers['Content-Length'], '10')
        assert.equal(full.headers['Content-Range'], undefined)
        assert.equal(Buffer.from(readMediaResponseBody(file, full) ?? []).toString(), '0123456789')
        const partial = createMediaResponsePlan('GET', 'bytes=2-5', 10)
        assert.equal(partial.status, 206)
        assert.equal(partial.headers['Content-Range'], 'bytes 2-5/10')
        assert.equal(partial.headers['Content-Length'], '4')
        const response = new Response(readMediaResponseBody(file, partial), {
            status: partial.status,
            headers: { 'Content-Type': 'video/mp4', ...partial.headers },
        })
        assert.equal(response.status, 206)
        assert.equal(response.headers.get('content-range'), 'bytes 2-5/10')
        assert.equal(await response.text(), '2345')
        const head = createMediaResponsePlan('HEAD', 'bytes=2-5', 10)
        assert.equal(head.status, 206)
        assert.deepEqual(head.headers, partial.headers)
        assert.equal(readMediaResponseBody(join(root, 'never-read'), head), null)
        const fullHead = createMediaResponsePlan('HEAD', undefined, 10)
        assert.equal(fullHead.status, 200)
        assert.equal(fullHead.headers['Content-Length'], '10')
        assert.equal(fullHead.body, null)
        const invalid = createMediaResponsePlan('GET', 'bytes=10-', 10)
        assert.equal(invalid.status, 416)
        assert.equal(invalid.headers['Content-Range'], 'bytes */10')
        assert.equal(invalid.headers['Content-Length'], '0')
        assert.equal(readMediaResponseBody(join(root, 'never-read'), invalid), null)
        const empty = createMediaResponsePlan('GET', undefined, 0)
        assert.equal(empty.status, 200)
        assert.equal(empty.headers['Content-Length'], '0')
        assert.equal(empty.body, null)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test('区间读取不会发送文件之外或截断后的错误字节长度', (): void => {
    const root = mkdtempSync(join(tmpdir(), 'learning-media-truncated-'))
    const file = join(root, 'sample.wav')
    try {
        writeFileSync(file, '0123456789')
        const suffix = createMediaResponsePlan('GET', 'bytes=-3', 10)
        assert.equal(Buffer.from(readMediaResponseBody(file, suffix) ?? []).toString(), '789')
        const oversized = createMediaResponsePlan('GET', 'bytes=3-99', 10)
        assert.equal(
            Buffer.from(readMediaResponseBody(file, oversized) ?? []).toString(),
            '3456789',
        )
        writeFileSync(file, '0123')
        assert.throws(() => readMediaResponseBody(file, oversized), /Media changed/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test('Range 传输仅限首版 WAV 和 MP4，HTML、RSC、图片等维持原有响应', (): void => {
    assert.equal(supportsMediaByteRanges('audio/wav'), true)
    assert.equal(supportsMediaByteRanges('video/mp4'), true)
    for (const mime of [
        'text/html; charset=utf-8',
        'text/x-component',
        'text/javascript; charset=utf-8',
        'image/png',
        'audio/mpeg',
        'application/octet-stream',
        'text/plain; charset=utf-8',
    ])
        assert.equal(supportsMediaByteRanges(mime), false)
})
