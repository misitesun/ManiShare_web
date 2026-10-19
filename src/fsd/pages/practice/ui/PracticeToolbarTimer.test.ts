import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeTimerContext } from '../model/usePracticeTimer'
import { createPracticeTimer } from '../model/practice-timer'
import { practiceDemos } from '../model/practice-demo'
import { PracticeToolbarTimer } from './PracticeToolbarControls'

test('所有内容族以零用时确定预渲染，不运行浏览器时钟、不宣称示例时间', (): void => {
    const timer = createPracticeTimer({
        now: (): number => assert.fail('预渲染不得读取真实时间'),
        setInterval: (): number => assert.fail('预渲染不得开启计时任务'),
        clearInterval: (): void => {},
    })
    const families = new Set(practiceDemos.map((demo) => demo.family))
    assert.equal(families.size, 12)
    for (const family of families) {
        const render = (): string =>
            renderToStaticMarkup(
                createElement(
                    PracticeTimerContext.Provider,
                    { value: timer },
                    createElement(PracticeToolbarTimer, { family }),
                ),
            )
        const html = render()
        assert.match(html, /role="timer"/)
        assert.match(html, /aria-live="off"/)
        assert.match(html, /aria-label="练习用时：00时00分00秒"/)
        assert.match(html, /data-practice-elapsed-seconds="0"/)
        assert.match(html, />00:00:00<\/span>/)
        assert.doesNotMatch(html, /示例|00:01:04/)
        assert.equal(render(), html)
    }
})
