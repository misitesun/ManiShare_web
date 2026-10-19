import assert from 'node:assert/strict'
import test from 'node:test'
import { getMonotonicMilliseconds } from './monotonic-time'

test('单调时钟入口保留原生毫秒精度，不读取墙上日期', (context): void => {
    const now = context.mock.method(globalThis.performance, 'now', (): number => 1234.75)
    assert.equal(getMonotonicMilliseconds(), 1234.75)
    now.mock.mockImplementation((): number => 4567.25)
    assert.equal(getMonotonicMilliseconds(), 4567.25)
})
