import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getHighlightRect } from './geometry'

const container = {
    left: 100,
    top: 50,
    width: 600,
    height: 400,
    scrollLeft: 0,
    scrollTop: 0,
    clientLeft: 1,
    clientTop: 1,
}
test('定位支持横排和多行网格，不依赖索引或固定间距', () => {
    assert.deepEqual(
        getHighlightRect(container, { left: 321, top: 181, width: 200, height: 100 }),
        { left: 220, top: 130, width: 200, height: 100 },
    )
})
test('内部滚动与容器边框不改变选中项的内容坐标', () => {
    assert.deepEqual(
        getHighlightRect(
            { ...container, scrollLeft: 20, scrollTop: 150 },
            { left: 81, top: -25, width: 180, height: 62 },
        ),
        { left: 0, top: 74, width: 180, height: 62 },
    )
})
test('响应式尺寸与小数坐标保持精度', () => {
    assert.deepEqual(
        getHighlightRect(container, { left: 101.5, top: 51.25, width: 140.5, height: 46 }),
        { left: 0.5, top: 0.25, width: 140.5, height: 46 },
    )
})
