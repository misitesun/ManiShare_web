import assert from 'node:assert/strict'
import test from 'node:test'
import { getCardSwapThrowPath } from './card-swap-throw'

const card = { left: 710, top: 228, width: 500, height: 500 }
const viewport = { left: 0, top: 0, width: 1920, height: 1080 }

test('八方向退场越过完整视口，旋转后的卡片外框离屏前不进入隐藏阶段', (): void => {
    for (let angle = 0; angle < 360; angle += 45) {
        const direction = {
            x: Math.cos((angle * Math.PI) / 180),
            y: Math.sin((angle * Math.PI) / 180),
        }
        for (const rotation of [-9, 0, 9]) {
            const path = getCardSwapThrowPath({
                card,
                viewport,
                position: { x: 0, y: 0 },
                direction,
                rotation,
            })
            const radians = (rotation * Math.PI) / 180
            const halfWidth =
                (Math.abs(Math.cos(radians)) * card.width +
                    Math.abs(Math.sin(radians)) * card.height) /
                2
            const halfHeight =
                (Math.abs(Math.sin(radians)) * card.width +
                    Math.abs(Math.cos(radians)) * card.height) /
                2
            const centerX = card.left + card.width / 2 + path.direction.x * path.clearance
            const centerY = card.top + card.height / 2 + path.direction.y * path.clearance
            assert.ok(
                centerX + halfWidth <= viewport.left - 63 ||
                    centerX - halfWidth >= viewport.left + viewport.width + 63 ||
                    centerY + halfHeight <= viewport.top - 63 ||
                    centerY - halfHeight >= viewport.top + viewport.height + 63,
                `方向${angle}°、旋转${rotation}°的卡片和光晕应完全离屏`,
            )
            assert.ok(
                Math.hypot(path.target.x, path.target.y) > path.clearance,
                '弹簧目标位于离屏点之外，不能在可见位置渐隐',
            )
        }
    }
})

test('已拖出超过一张卡宽但仍可见时，从释放位置继续向外飞出', (): void => {
    const position = { x: -800, y: -100 }
    const path = getCardSwapThrowPath({
        card,
        viewport,
        position,
        direction: { x: -1, y: 0 },
        rotation: -9,
    })
    assert.deepEqual(path.origin, position)
    assert.ok(path.clearance > 400, '不能因累计位移超过旧512px阈值而直接隐藏')
    assert.ok(path.target.x < position.x - path.clearance)
    assert.equal(path.target.y, position.y)
})

test('窄视口及偏移的可见视口使用当前边缘，退场距离不固定为卡片宽度', (): void => {
    const compact = getCardSwapThrowPath({
        card: { left: 12, top: 120, width: 366, height: 366 },
        viewport: { left: 0, top: 0, width: 390, height: 844 },
        position: { x: 0, y: 80 },
        direction: { x: 0, y: 1 },
        rotation: 0,
    })
    assert.equal(compact.clearance, 708)
    const offset = getCardSwapThrowPath({
        card,
        viewport: { left: 100, top: 200, width: 800, height: 600 },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        rotation: 0,
    })
    assert.equal(offset.clearance, 254)
})

test('已完全离屏的释放保留向外运动，零方向回退有效路径', (): void => {
    for (const direction of [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
    ]) {
        const path = getCardSwapThrowPath({
            card,
            viewport,
            position: { x: -2000, y: 0 },
            direction,
            rotation: 0,
        })
        assert.ok(Number.isFinite(path.clearance) && path.clearance > 0)
        assert.ok(Number.isFinite(path.target.x) && Number.isFinite(path.target.y))
        assert.equal(Math.hypot(path.direction.x, path.direction.y), 1)
    }
})
