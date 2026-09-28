import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { getThemeBootstrapScript } from './bootstrap'

function bootstrap(raw: string | null, blocked = false): string {
    const dataset = { theme: 'dark' }
    runInNewContext(getThemeBootstrapScript(), {
        document: { documentElement: { dataset } },
        window: {
            localStorage: {
                getItem(): string | null {
                    if (blocked) throw new Error('Storage unavailable')
                    return raw
                },
            },
        },
    })
    return dataset.theme
}
test('theme bootstrap restores current JSON and legacy raw preferences', (): void => {
    assert.equal(bootstrap('"light"'), 'light')
    assert.equal(bootstrap('light'), 'light')
    assert.equal(bootstrap('"dark"'), 'dark')
})
test('theme bootstrap keeps the deterministic default for unknown or absent values', (): void => {
    for (const raw of [null, 'unknown', 'null', '{}', '"light;throw Error()"'])
        assert.equal(bootstrap(raw), 'dark')
})
test('theme bootstrap tolerates unavailable browser storage', (): void => {
    assert.equal(bootstrap(null, true), 'dark')
})
