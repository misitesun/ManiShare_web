import assert from 'node:assert/strict'
import test from 'node:test'
import { createCardSwapDismissal } from './card-swap-dismissal'

test('专用退场捕获当前卡并互斥，其他卡的动画结束不能提交', (): void => {
    const action = createCardSwapDismissal()
    let completed = 0
    assert.equal(action.pending(), null)
    assert.equal(
        action.begin(3, (): void => {
            completed += 1
        }),
        true,
    )
    assert.equal(action.pending()?.index, 3)
    assert.equal(
        action.begin(4, (): void => assert.fail('重复动作不能接管')),
        false,
    )
    assert.equal(action.take(4), null)
    assert.equal(completed, 0)
    const complete = action.take(3)
    assert.ok(complete)
    assert.equal(action.pending(), null)
    assert.equal(completed, 0, '交出回调不提前执行父级列表变更')
    complete()
    assert.equal(completed, 1)
    assert.equal(action.take(3), null)
})

test('取消/reset/卸载复用废弃路径，迟到的退场结束不再提交', (): void => {
    const action = createCardSwapDismissal()
    assert.equal(
        action.begin(0, (): void => assert.fail('取消后不能提交')),
        true,
    )
    action.cancel()
    action.cancel()
    assert.equal(action.pending(), null)
    assert.equal(action.take(0), null)
    assert.equal(
        action.begin(1, (): void => {}),
        true,
    )
    assert.equal(action.take(0), null)
    assert.ok(action.take(1))
})

test('同步完成前先清除动作锁，末张与reduced-motion也只提交一次', (): void => {
    const action = createCardSwapDismissal()
    let completed = 0
    action.begin(0, (): void => {
        assert.equal(action.pending(), null)
        completed += 1
        assert.equal(
            action.begin(0, (): void => {
                completed += 1
            }),
            true,
        )
    })
    action.take(0)?.()
    assert.equal(completed, 1)
    action.take(0)?.()
    assert.equal(completed, 2)
    assert.equal(action.take(0), null)
    assert.equal(
        action.begin(-1, (): void => {}),
        false,
    )
    assert.equal(
        action.begin(0.5, (): void => {}),
        false,
    )
})

test('取消先清动作再交出取消回调且不完成，重复取消与卸载废弃均不迟到提交', (): void => {
    const action = createCardSwapDismissal()
    let completed = 0
    let canceled = 0
    const onComplete = (): void => {
        completed += 1
    }
    const onCancel = (): void => {
        assert.equal(action.pending(), null)
        canceled += 1
        assert.equal(action.cancel(), null)
    }
    action.begin(0, onComplete, onCancel)
    const cancel = action.cancel()
    assert.equal(action.pending(), null)
    assert.equal(canceled, 0)
    cancel?.()
    assert.equal(canceled, 1)
    assert.equal(completed, 0)
    assert.equal(action.cancel(), null)
    assert.equal(action.take(0), null)

    action.begin(0, onComplete, onCancel)
    action.take(0)?.()
    assert.equal(completed, 1)
    assert.equal(canceled, 1, '完成不会调用取消回调')
    assert.equal(action.cancel(), null)

    action.begin(0, onComplete, onCancel)
    action.cancel()
    assert.equal(canceled, 1, '卸载丢弃返回值，不更新父级状态')
    assert.equal(action.take(0), null)
    assert.equal(completed, 1)
})
