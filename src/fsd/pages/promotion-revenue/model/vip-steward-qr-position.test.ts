import assert from 'node:assert/strict'
import test from 'node:test'
import { getVipStewardQrPosition } from './vip-steward-qr-position'

test('VIP小管家二维码默认显示在IP形象下方并水平居中', (): void => {
    assert.deepEqual(
        getVipStewardQrPosition({ left: 476, top: 118, width: 84, bottom: 202 }, 1920, 1080),
        { left: 459, top: 210 },
    )
})

test('VIP小管家二维码避让左右边缘，窄窗口保留完整二维码', (): void => {
    assert.equal(
        getVipStewardQrPosition({ left: 0, top: 118, width: 64, bottom: 182 }, 390, 844).left,
        8,
    )
    assert.equal(
        getVipStewardQrPosition({ left: 350, top: 118, width: 64, bottom: 182 }, 390, 844).left,
        264,
    )
})

test('VIP小管家二维码靠近底部时向上显示', (): void => {
    assert.deepEqual(
        getVipStewardQrPosition({ left: 1000, top: 700, width: 64, bottom: 764 }, 1440, 800),
        { left: 973, top: 549 },
    )
})

test('VIP小管家二维码在短窗口中限制垂直位置', (): void => {
    assert.deepEqual(
        getVipStewardQrPosition({ left: 10, top: 50, width: 64, bottom: 114 }, 320, 200),
        { left: 8, top: 8 },
    )
})
