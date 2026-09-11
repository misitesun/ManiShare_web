import assert from 'node:assert/strict'
import test from 'node:test'
import { canAutoLoadNextPage, getPaginationMessageKey } from './pagination-status'

test('only idle pagination can observe the list bottom', (): void => {
    assert.equal(canAutoLoadNextPage('idle'), true)
    assert.equal(canAutoLoadNextPage('loading'), false)
    assert.equal(canAutoLoadNextPage('exhausted'), false)
    assert.equal(canAutoLoadNextPage('error'), false)
})

test('visible pagination states map to their shared copy', (): void => {
    assert.equal(getPaginationMessageKey('idle'), undefined)
    assert.equal(getPaginationMessageKey('loading'), 'pagination.loading')
    assert.equal(getPaginationMessageKey('exhausted'), 'pagination.noMore')
    assert.equal(getPaginationMessageKey('error'), 'pagination.loadFailedRetry')
})
