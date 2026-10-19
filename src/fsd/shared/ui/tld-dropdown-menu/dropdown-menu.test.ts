import assert from 'node:assert/strict'
import test from 'node:test'
import { getDropdownMenuFocusIndex, getDropdownMenuGeometry } from './dropdown-menu'

test('action menu keyboard navigation wraps and supports both ends without inventing an empty target', (): void => {
    assert.equal(getDropdownMenuFocusIndex('ArrowDown', 2, 3), 0)
    assert.equal(getDropdownMenuFocusIndex('ArrowUp', 0, 3), 2)
    assert.equal(getDropdownMenuFocusIndex('Home', 2, 3), 0)
    assert.equal(getDropdownMenuFocusIndex('End', 0, 3), 2)
    assert.equal(getDropdownMenuFocusIndex('ArrowDown', -1, 3), 0)
    assert.equal(getDropdownMenuFocusIndex('ArrowUp', -1, 3), 2)
    assert.equal(getDropdownMenuFocusIndex('ArrowDown', 0, 0), null)
})

test('dropdown right-aligns to its trigger and constrains its scrollable height', (): void => {
    assert.deepEqual(
        getDropdownMenuGeometry(
            { top: 14, bottom: 58, right: 378 },
            { left: 0, top: 0, width: 390, height: 844 },
            9,
        ),
        { left: 170, top: 66, width: 208, maxHeight: 480 },
    )
    assert.deepEqual(
        getDropdownMenuGeometry(
            { top: 14, bottom: 58, right: 308 },
            { left: 0, top: 0, width: 320, height: 240 },
            9,
        ),
        { left: 100, top: 66, width: 208, maxHeight: 162 },
    )
})

test('narrow and visual viewports clamp the menu and bottom triggers can open upwards', (): void => {
    assert.deepEqual(
        getDropdownMenuGeometry(
            { top: 14, bottom: 58, right: 100 },
            { left: 30, top: 0, width: 180, height: 300 },
            9,
        ),
        { left: 42, top: 66, width: 156, maxHeight: 222 },
    )
    assert.deepEqual(
        getDropdownMenuGeometry(
            { top: 700, bottom: 744, right: 378 },
            { left: 0, top: 0, width: 390, height: 800 },
            3,
        ),
        { left: 170, top: 542, width: 208, maxHeight: 480 },
    )
})
