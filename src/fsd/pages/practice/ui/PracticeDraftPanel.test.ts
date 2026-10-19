import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeDraftPanel } from './PracticeDraftPanel'

test('章节草稿首屏延迟Portal，不读视口、不申请媒体权限或写入存储', (): void => {
    let actions = 0
    function action(): void {
        actions += 1
    }
    for (const open of [false, true]) {
        assert.equal(
            renderToStaticMarkup(
                createElement(PracticeDraftPanel, {
                    open,
                    scope: 'phonetics:chapter-1',
                    text: '章节演示草稿',
                    onTextChange: action,
                    onClear: action,
                    onSave: action,
                    onClose: action,
                }),
            ),
            '',
        )
    }
    assert.equal(actions, 0)
})
