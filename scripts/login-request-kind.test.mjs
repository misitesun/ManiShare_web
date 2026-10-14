import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { isExportedPageRequest } = require('./login-request-kind.cjs')
const pages = new Set(['/settings/', '/leaderboard/', '/api/auth/login/'])

test('exported page requests recognize the Electron protocol as well as HTTP origins', () => {
    assert.equal(
        isExportedPageRequest(
            { url: 'englishlearning://app/leaderboard/', method: 'GET' },
            'englishlearning://app',
            pages,
        ),
        true,
    )
    assert.equal(
        isExportedPageRequest(
            { url: 'http://127.0.0.1:4173/settings/?tab=appearance', method: 'GET' },
            'http://127.0.0.1:4173',
            pages,
        ),
        true,
    )
})

test('account APIs, POSTs, foreign hosts, foreign schemes and unexported paths remain observable', () => {
    assert.equal(
        isExportedPageRequest(
            { url: 'englishlearning://app/settings/', method: 'HEAD' },
            'englishlearning://app',
            pages,
        ),
        true,
    )
    for (const details of [
        { url: 'englishlearning://app/api/auth/login/', method: 'HEAD' },
        { url: 'englishlearning://app/api/auth/login/', method: 'GET' },
        { url: 'englishlearning://app/settings/', method: 'POST' },
        { url: 'englishlearning://other/settings/', method: 'GET' },
        { url: 'https://app/settings/', method: 'GET' },
        { url: 'englishlearning://app/login-request/', method: 'GET' },
    ])
        assert.equal(isExportedPageRequest(details, 'englishlearning://app', pages), false)
})
