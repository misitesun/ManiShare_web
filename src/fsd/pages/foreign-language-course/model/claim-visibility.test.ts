import assert from 'node:assert/strict'
import test from 'node:test'
import { getClaimNoticeScrollTop } from './claim-visibility'

const bounds = {
    viewportTop: 158,
    viewportBottom: 968,
    noticeTop: 945.5,
    noticeBottom: 970.5,
    currentScrollTop: 0,
    maxScrollTop: 26,
}

test('claim notice clipped by the fixed footer is revealed with a readable edge gap', (): void => {
    assert.equal(getClaimNoticeScrollTop(bounds), 18.5)
})

test('fully visible claim notice preserves the user scroll position', (): void => {
    assert.equal(
        getClaimNoticeScrollTop({
            ...bounds,
            noticeTop: 700,
            noticeBottom: 725,
            currentScrollTop: 20,
        }),
        20,
    )
})

test('claim notice above the visible region requests an upward scroll', (): void => {
    assert.equal(
        getClaimNoticeScrollTop({
            ...bounds,
            noticeTop: 150,
            noticeBottom: 175,
            currentScrollTop: 26,
        }),
        2,
    )
})

test('claim reveal stays within the scrollable region in short or non-scrollable viewports', (): void => {
    assert.equal(getClaimNoticeScrollTop({ ...bounds, noticeBottom: 1200 }), 26)
    assert.equal(getClaimNoticeScrollTop({ ...bounds, maxScrollTop: 0 }), 0)
    assert.equal(getClaimNoticeScrollTop({ ...bounds, noticeTop: 0, noticeBottom: 25 }), 0)
})
