import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createPracticeEntryLoadingCompletion,
    completePracticeEntryLoading,
    getPracticeEntryLoadingProgress,
    practiceEntryLoadingDurationMs,
    reconcilePracticeEntryLoading,
} from './practice-entry-loading'

test('计时先到时无需等待动画帧，动画晚到也只能完成一次', (): void => {
    let completed = 0
    const completion = createPracticeEntryLoadingCompletion((): void => {
        completed += 1
    })
    const timer = completion.finish
    const animation = completion.finish
    timer()
    animation()
    timer()
    assert.equal(completed, 1)
})

test('动画先结束仍只完成一次，入口卸载后晚到计时和动画都无效', (): void => {
    let completed = 0
    const complete = (): void => {
        completed += 1
    }
    const animationFirst = createPracticeEntryLoadingCompletion(complete)
    animationFirst.finish()
    animationFirst.finish()
    assert.equal(completed, 1)
    const cancelled = createPracticeEntryLoadingCompletion(complete)
    cancelled.cancel()
    cancelled.finish()
    cancelled.finish()
    assert.equal(completed, 1)
})

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
