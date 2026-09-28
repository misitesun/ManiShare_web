import assert from 'node:assert/strict'
import test from 'node:test'
import { isPathActive } from './navigation-path'
test('canonical trailing slashes retain exact and child navigation matching', (): void => {
    assert.equal(isPathActive('/profile/', '/profile', true), true)
    assert.equal(isPathActive('/profile/notes/courses/one/', '/profile/notes/'), true)
    assert.equal(isPathActive('/profile/notes-extra/', '/profile/notes/'), false)
    assert.equal(isPathActive('/profile/', '/'), false)
    assert.equal(isPathActive('/', '/', true), true)
    assert.equal(isPathActive('/', undefined), false)
})
