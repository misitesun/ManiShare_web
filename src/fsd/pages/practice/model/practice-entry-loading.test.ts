import assert from 'node:assert/strict'
import test from 'node:test'
import {
    completePracticeEntryLoading,
    getPracticeEntryLoadingProgress,
    practiceEntryLoadingDurationMs,
    reconcilePracticeEntryLoading,
} from './practice-entry-loading'

test('entry progress runs linearly for two seconds and stays within its accessible range', (): void => {
    assert.equal(practiceEntryLoadingDurationMs, 2000)
    for (const [elapsed, expected] of [
        [-1, 0],
        [0, 0],
        [500, 25],
        [1000, 50],
        [1500, 75],
        [1999, 99],
        [2000, 100],
        [2500, 100],
        [Number.NaN, 0],
    ]) {
        assert.equal(getPracticeEntryLoadingProgress(elapsed), expected)
    }
})

test('current entry stays ready on same-mode selection while a different mode loads anew', (): void => {
    const loading = { entryKey: 'chapter:word-basic:typing', ready: false }
    const ready = completePracticeEntryLoading(loading, loading.entryKey)
    assert.equal(ready.ready, true)
    assert.equal(reconcilePracticeEntryLoading(ready, loading.entryKey), ready)
    assert.equal(completePracticeEntryLoading(ready, loading.entryKey), ready)
    const changed = reconcilePracticeEntryLoading(ready, 'chapter:word-basic:spell')
    assert.deepEqual(changed, { entryKey: 'chapter:word-basic:spell', ready: false })
    assert.equal(completePracticeEntryLoading(changed, loading.entryKey), changed)
})

test('leaving for the catalog invalidates completion and re-entering the same demo loads again', (): void => {
    const ready = { entryKey: 'demo:sentence-basic:typing', ready: true }
    const catalog = reconcilePracticeEntryLoading(ready, null)
    assert.deepEqual(catalog, { entryKey: null, ready: false })
    assert.equal(completePracticeEntryLoading(catalog, ready.entryKey), catalog)
    assert.equal(completePracticeEntryLoading(catalog, null), catalog)
    assert.deepEqual(reconcilePracticeEntryLoading(catalog, ready.entryKey), {
        entryKey: ready.entryKey,
        ready: false,
    })
})

test('changing a source chapter reloads even when the demo and mode are identical', (): void => {
    const ready = { entryKey: 'chapter-one:word-basic:typing', ready: true }
    assert.deepEqual(reconcilePracticeEntryLoading(ready, 'chapter-two:word-basic:typing'), {
        entryKey: 'chapter-two:word-basic:typing',
        ready: false,
    })
})
