import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getNavigationStateForViewport,
    hasCollapsedNavigationRail,
    toggleNavigationState,
} from './navigation-state'

test('navigation uses the viewport default when the responsive mode changes', (): void => {
    assert.deepEqual(getNavigationStateForViewport('mobile'), {
        viewport: 'mobile',
        isNavigationOpen: false,
    })
    assert.deepEqual(getNavigationStateForViewport('tablet'), {
        viewport: 'tablet',
        isNavigationOpen: false,
    })
    assert.deepEqual(getNavigationStateForViewport('desktop'), {
        viewport: 'desktop',
        isNavigationOpen: true,
    })
})

test('navigation toggle preserves the current responsive mode', (): void => {
    assert.deepEqual(toggleNavigationState(getNavigationStateForViewport('mobile')), {
        viewport: 'mobile',
        isNavigationOpen: true,
    })
    assert.deepEqual(toggleNavigationState(getNavigationStateForViewport('desktop')), {
        viewport: 'desktop',
        isNavigationOpen: false,
    })
})

test('collapsed navigation keeps a rail outside the mobile viewport', (): void => {
    assert.equal(hasCollapsedNavigationRail(getNavigationStateForViewport('mobile')), false)
    assert.equal(hasCollapsedNavigationRail(getNavigationStateForViewport('tablet')), true)
    assert.equal(
        hasCollapsedNavigationRail(toggleNavigationState(getNavigationStateForViewport('desktop'))),
        true,
    )
})
