import assert from 'node:assert/strict'
import test from 'node:test'
import type {
    PhoneticsReadingSnapshot,
    PhoneticsReadingSurface,
} from '../model/phonetics-reading-runtime'
import { getPhoneticsReadingView } from './phonetics-reading-view'

test('同一播放来源只展示一个位置，加载和段间等待保留该处静态声纹', (): void => {
    for (const surface of ['target', 'word'] as const) {
        const other: PhoneticsReadingSurface = surface === 'target' ? 'word' : 'target'
        for (const status of ['loading', 'waiting', 'playing'] as const) {
            const reading: PhoneticsReadingSnapshot = {
                status,
                playRequested: true,
                surface,
                step: null,
                error: null,
            }
            assert.deepEqual(getPhoneticsReadingView(reading, surface, '雨滴点阵'), {
                status: status === 'playing' ? 'playing' : 'waiting',
                waveStyle: '雨滴点阵',
            })
            assert.equal(getPhoneticsReadingView(reading, other, '雨滴点阵'), undefined)
            assert.equal(
                getPhoneticsReadingView({ ...reading, playRequested: false }, surface, '雨滴点阵'),
                undefined,
            )
        }
    }
})

test('空快照、停止、结束及失败状态不遗留遮罩', (): void => {
    assert.equal(getPhoneticsReadingView(undefined, 'word', '默认竖条'), undefined)
    for (const status of ['idle', 'paused', 'ended', 'error', 'unavailable'] as const) {
        assert.equal(
            getPhoneticsReadingView(
                { status, playRequested: true, surface: 'word', step: null, error: null },
                'word',
                '默认竖条',
            ),
            undefined,
        )
    }
})
