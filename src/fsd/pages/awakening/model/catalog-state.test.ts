import assert from 'node:assert/strict'
import { test } from 'node:test'
import { awakeningCatalogReducer, initialAwakeningCatalogState } from './catalog-state'

test('catalog starts with design selections and eight cards', () => {
    assert.deepEqual(initialAwakeningCatalogState, {
        category: '全部课程',
        recommendation: '最新上架',
        access: '免费',
        visibleCount: 8,
    })
})

test('pagination appends eight, clamps at total and selection resets pagination only on change', () => {
    const loaded = awakeningCatalogReducer(initialAwakeningCatalogState, {
        type: 'load',
        total: 16,
    })
    assert.equal(loaded.visibleCount, 16)
    assert.equal(awakeningCatalogReducer(loaded, { type: 'load', total: 16 }).visibleCount, 16)
    assert.equal(
        awakeningCatalogReducer(loaded, { type: 'select', group: 'access', value: '免费' }),
        loaded,
    )
    const changed = awakeningCatalogReducer(loaded, {
        type: 'select',
        group: 'category',
        value: '分级阅读',
    })
    assert.equal(changed.visibleCount, 8)
    assert.equal(changed.category, '分级阅读')
    assert.equal(changed.recommendation, '最新上架')
    assert.equal(changed.access, '免费')
    assert.equal(
        awakeningCatalogReducer(changed, { type: 'select', group: 'category', value: '非法选项' }),
        changed,
    )
})
