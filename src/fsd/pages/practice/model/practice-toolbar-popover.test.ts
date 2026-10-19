import assert from 'node:assert/strict'
import test from 'node:test'
import { getToolbarPopoverPosition } from './practice-toolbar-popover'

test('工具栏浮层在PC保持按钮居中及10px下移', (): void => {
    assert.deepEqual(
        getToolbarPopoverPosition({ left: 108, bottom: 122, width: 26 }, 64, {
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
        }),
        { left: 89, top: 132, arrowLeft: 32, maxHeight: 944 },
    )
})

test('局部横滚后靠视口边缘的按钮，其浮层与箭头仍在可见区域内', (): void => {
    const viewport = { left: 0, top: 0, width: 320, height: 640 }
    assert.deepEqual(
        getToolbarPopoverPosition({ left: 4, bottom: 150, width: 40 }, 128, viewport),
        { left: 4, top: 160, arrowLeft: 20, maxHeight: 476 },
    )
    assert.deepEqual(
        getToolbarPopoverPosition({ left: 280, bottom: 150, width: 40 }, 128, viewport),
        { left: 188, top: 160, arrowLeft: 112, maxHeight: 476 },
    )
})

test('可视视口偏移和缩短参与定位，空间不足时不产生负的滚动高度', (): void => {
    assert.deepEqual(
        getToolbarPopoverPosition({ left: 120, bottom: 200, width: 40 }, 128, {
            left: 100,
            top: 80,
            width: 280,
            height: 100,
        }),
        { left: 104, top: 210, arrowLeft: 36, maxHeight: 0 },
    )
})
