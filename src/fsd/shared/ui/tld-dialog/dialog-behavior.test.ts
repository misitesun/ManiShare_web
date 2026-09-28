import assert from 'node:assert/strict'
import test from 'node:test'
import { canDismissTldDialog } from './dialog-behavior'

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
