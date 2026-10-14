import assert from 'node:assert/strict'
import test from 'node:test'
import { canDismissTldDialog, getDialogTabTarget } from './dialog-behavior'

test('dialog dismiss triggers respect their independent close policies', (): void => {
    assert.equal(
        canDismissTldDialog('backdrop', {
            closeOnBackdrop: true,
            closeOnEscape: false,
        }),
        true,
    )
    assert.equal(
        canDismissTldDialog('escape', {
            closeOnBackdrop: true,
            closeOnEscape: false,
        }),
        false,
    )
    assert.equal(
        canDismissTldDialog('backdrop', {
            closeOnBackdrop: false,
            closeOnEscape: true,
        }),
        false,
    )
    assert.equal(
        canDismissTldDialog('escape', {
            closeOnBackdrop: false,
            closeOnEscape: true,
        }),
        true,
    )
})
test('首次 frame 焦点及意外外部焦点的双向 Tab 都进入弹窗，首尾与单项循环', (): void => {
    for (const position of ['frame', 'outside', 'only'] as const) {
        assert.equal(getDialogTabTarget(position, false, true), 'first')
        assert.equal(getDialogTabTarget(position, true, true), 'last')
    }
    assert.equal(getDialogTabTarget('first', true, true), 'last')
    assert.equal(getDialogTabTarget('last', false, true), 'first')
    assert.equal(getDialogTabTarget('inside', false, true), null)
    assert.equal(getDialogTabTarget('inside', true, true), null)
    assert.equal(getDialogTabTarget('first', false, true), null)
    assert.equal(getDialogTabTarget('last', true, true), null)
    assert.equal(getDialogTabTarget('frame', false, false), 'frame')
    assert.equal(getDialogTabTarget('frame', true, false), 'frame')
})
