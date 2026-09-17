import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appendImageFiles, normalizeImageLimit, removeImageFile } from './image-files'

function createFile(name: string, type: string): File {
    return new File(['content'], name, { type })
}

test('appendImageFiles accepts images only and respects the configured limit', () => {
    const firstImage = createFile('first.png', 'image/png')
    const secondImage = createFile('second.webp', 'image/webp')
    const textFile = createFile('notes.txt', 'text/plain')

    assert.deepEqual(appendImageFiles([firstImage], [textFile, secondImage], 2), [
        firstImage,
        secondImage,
    ])
})

test('removeImageFile removes only the requested preview', () => {
    const firstImage = createFile('first.png', 'image/png')
    const secondImage = createFile('second.webp', 'image/webp')

    assert.deepEqual(removeImageFile([firstImage, secondImage], 0), [secondImage])
})

test('normalizeImageLimit always returns a positive integer', () => {
    assert.equal(normalizeImageLimit(3.8), 3)
    assert.equal(normalizeImageLimit(0), 1)
    assert.equal(normalizeImageLimit(Number.POSITIVE_INFINITY), 1)
})
