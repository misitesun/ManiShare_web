import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shouldShowLocationPrompt } from './location-prompt-state'

test('location prompt opens until an explicit boolean confirmation exists', () => {
    assert.equal(shouldShowLocationPrompt(null), true)
    assert.equal(shouldShowLocationPrompt(false), true)
    assert.equal(shouldShowLocationPrompt('true'), true)
    assert.equal(shouldShowLocationPrompt(true), false)
})
