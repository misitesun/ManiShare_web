import assert from 'node:assert/strict'
import test from 'node:test'
import { getSelectMenuGeometry } from './select-menu-position'

test('select portal aligns with its trigger and grows to fit the longest option', (): void => {
    assert.deepEqual(
        getSelectMenuGeometry(
            { left: 110, top: 50, bottom: 90, width: 54 },
            { left: 0, top: 0, width: 390, height: 844 },
            { width: 82, height: 168 },
        ),
        { left: 110, top: 98, width: 82, maxHeight: 256 },
    )
    assert.equal(
        getSelectMenuGeometry(
            { left: 110, top: 50, bottom: 90, width: 110 },
            { left: 0, top: 0, width: 390, height: 844 },
            { width: 82, height: 168 },
        ).width,
        110,
    )
})

test('select portal remains visible after horizontal scrolling and visual viewport changes', (): void => {
    assert.deepEqual(
        getSelectMenuGeometry(
            { left: 280, top: 50, bottom: 90, width: 82 },
            { left: 0, top: 0, width: 320, height: 640 },
            { width: 96, height: 168 },
        ),
        { left: 216, top: 98, width: 96, maxHeight: 256 },
    )
    assert.deepEqual(
        getSelectMenuGeometry(
            { left: 10, top: 50, bottom: 90, width: 82 },
            { left: 30, top: 20, width: 180, height: 300 },
            { width: 240, height: 168 },
        ),
        { left: 38, top: 98, width: 164, maxHeight: 214 },
    )
})

test('select portal opens above bottom anchors and limits tall menus without extending the viewport', (): void => {
    assert.deepEqual(
        getSelectMenuGeometry(
            { left: 100, top: 550, bottom: 590, width: 82 },
            { left: 0, top: 0, width: 320, height: 640 },
            { width: 96, height: 168 },
        ),
        { left: 100, top: 374, width: 96, maxHeight: 256 },
    )
    assert.deepEqual(
        getSelectMenuGeometry(
            { left: 100, top: 50, bottom: 90, width: 82 },
            { left: 0, top: 0, width: 320, height: 240 },
            { width: 96, height: 500 },
        ),
        { left: 100, top: 98, width: 96, maxHeight: 134 },
    )
})
