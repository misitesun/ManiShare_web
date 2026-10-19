import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticePauseDialog } from './PracticePauseDialog'

test('暂停窗预渲染不读取焦点、计时和存储，也不提前创建Portal或恢复游戏', (): void => {
    for (const open of [false, true])
        assert.equal(
            renderToStaticMarkup(
                createElement(PracticePauseDialog, {
                    open,
                    onContinue: (): void => assert.fail('预渲染不得恢复游戏'),
                    onAfterClose: (): void => assert.fail('预渲染不得执行退场'),
                }),
            ),
            '',
        )
})
