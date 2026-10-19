import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDataUrlPreviewSession } from './image-previews'
import type { ImageDataReader, ImagePreview } from './image-previews'

interface ControlledReader {
    readonly reader: ImageDataReader
    readonly load: (source: string) => void
    readonly fail: () => void
    readonly abortCount: () => number
}

function createControlledReader(): ControlledReader {
    let onLoad: (source: string) => void = (): void => undefined
    let onError: () => void = (): void => undefined
    let aborted = 0
    return {
        reader: {
            read(_file, load, error): void {
                onLoad = load
                onError = error
            },
            abort(): void {
                aborted += 1
            },
        },
        load: (source): void => onLoad(source),
        fail: (): void => onError(),
        abortCount: (): number => aborted,
    }
}

function imageFile(name: string): File {
    return new File(['image'], name, { type: 'image/png' })
}

test('data URL预览按文件顺序呈现，读取完成顺序不会更改文件对应关系', (): void => {
    const first = createControlledReader()
    const second = createControlledReader()
    const readers = [first.reader, second.reader]
    const files = [imageFile('first.png'), imageFile('second.png')]
    let current: readonly ImagePreview[] = []
    createDataUrlPreviewSession(
        files,
        (): ImageDataReader => {
            const reader = readers.shift()
            if (reader === undefined) throw new Error('缺少读取器')
            return reader
        },
        (previews): void => {
            current = previews
        },
    )
    second.load('data:image/png;base64,second')
    assert.deepEqual(
        current.map((preview) => preview.status),
        ['loading', 'ready'],
    )
    assert.deepEqual(
        current.map((preview) => preview.file),
        files,
    )
    first.load('data:image/png;base64,first')
    assert.deepEqual(
        current.map((preview) => preview.source),
        ['data:image/png;base64,first', 'data:image/png;base64,second'],
    )
})

test('文件变更或卸载清理会终止全部读取并忽略迟到的成功与失败回调', (): void => {
    const controlled = createControlledReader()
    const updates: Array<readonly ImagePreview[]> = []
    const dispose = createDataUrlPreviewSession(
        [imageFile('old.png')],
        (): ImageDataReader => controlled.reader,
        (previews): void => {
            updates.push(previews)
        },
    )
    dispose()
    controlled.load('data:image/png;base64,stale')
    controlled.fail()
    assert.equal(controlled.abortCount(), 1)
    assert.equal(updates.length, 1)
    assert.equal(updates[0]?.[0]?.status, 'loading')
})

test('读取失败保留原文件和错误态，消费者仍可展示移除入口', (): void => {
    const controlled = createControlledReader()
    const file = imageFile('broken.png')
    let current: readonly ImagePreview[] = []
    createDataUrlPreviewSession(
        [file],
        (): ImageDataReader => controlled.reader,
        (previews): void => {
            current = previews
        },
    )
    controlled.fail()
    assert.deepEqual(current, [{ file, source: null, status: 'error' }])
})

test('同步读取异常转为错误态，不影响会话清理', (): void => {
    let aborted = false
    let current: readonly ImagePreview[] = []
    const dispose = createDataUrlPreviewSession(
        [imageFile('unreadable.png')],
        (): ImageDataReader => ({
            read(): void {
                throw new Error('读取失败')
            },
            abort(): void {
                aborted = true
            },
        }),
        (previews): void => {
            current = previews
        },
    )
    assert.equal(current[0]?.status, 'error')
    dispose()
    assert.equal(aborted, true)
})
