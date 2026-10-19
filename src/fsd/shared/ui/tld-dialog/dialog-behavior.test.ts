import assert from 'node:assert/strict'
import test from 'node:test'
import {
    canDismissTldDialog,
    dismissTldDialogBackdrop,
    getDialogTabTarget,
} from './dialog-behavior'

test('遮罩关闭在焦点恢复前取消原生默认动作，关闭后不被默认聚焦覆盖', (): void => {
    const backdrop = new EventTarget()
    let dismissCount = 0
    backdrop.addEventListener('pointerdown', (event): void => {
        dismissTldDialogBackdrop(
            event,
            { closeOnBackdrop: true, closeOnEscape: true },
            (): void => {
                assert.equal(event.defaultPrevented, true)
                dismissCount += 1
            },
        )
    })
    assert.equal(backdrop.dispatchEvent(new Event('pointerdown', { cancelable: true })), false)
    assert.equal(dismissCount, 1)
})

test('正文点击与禁止遮罩关闭均保留原生默认动作且不关闭', (): void => {
    const backdrop = new EventTarget()
    const content = new EventTarget()
    for (const [target, closeOnBackdrop] of [
        [content, true],
        [backdrop, false],
    ] as const) {
        let prevented = false
        let dismissed = false
        assert.equal(
            dismissTldDialogBackdrop(
                {
                    target,
                    currentTarget: backdrop,
                    preventDefault(): void {
                        prevented = true
                    },
                },
                { closeOnBackdrop, closeOnEscape: true },
                (): void => {
                    dismissed = true
                },
            ),
            false,
        )
        assert.equal(prevented, false)
        assert.equal(dismissed, false)
    }
})

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
