import assert from 'node:assert/strict'
import test from 'node:test'
import { getHeaderQrPosition, headerQrCopy, isHeaderQrAction } from './header-qr'

test('三个明确动作对应原稿中文，未登记的动作不打开二维码浮层', (): void => {
    for (const key of ['club-qr', 'service-qr', 'play-qr'])
        assert.equal(isHeaderQrAction(key), true)
    for (const key of ['feedback', '', undefined]) assert.equal(isHeaderQrAction(key), false)
    assert.equal(headerQrCopy['service-qr'].description, '微信扫一扫咨询客服')
    assert.equal(headerQrCopy['play-qr'].description, '微信扫一扫查看')
})

test('二维码浮层对齐触发按钮并避让屏幕左右及底部边缘', (): void => {
    assert.deepEqual(
        getHeaderQrPosition({ left: 1031, top: 24, width: 134, bottom: 56 }, 1920, 1080),
        {
            left: 1039,
            top: 64,
            below: true,
        },
    )
    assert.equal(getHeaderQrPosition({ left: 0, top: 24, width: 28, bottom: 52 }, 390, 844).left, 8)
    assert.equal(
        getHeaderQrPosition({ left: 370, top: 24, width: 20, bottom: 52 }, 390, 844).left,
        264,
    )
    assert.deepEqual(
        getHeaderQrPosition({ left: 400, top: 740, width: 32, bottom: 772 }, 1440, 800),
        {
            left: 357,
            top: 585,
            below: false,
        },
    )
})
