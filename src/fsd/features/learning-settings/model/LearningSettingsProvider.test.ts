import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LearningSettingsProvider } from './LearningSettingsProvider'
import { useLearningSettingsSnapshot } from './useLearningSettings'
import { defaultPreferences } from './preferences'

test('同一 Provider 下的消费者在预渲染时共享确定默认值并等待挂载恢复', (): void => {
    function ReadSettings(): ReactElement {
        const snapshot = useLearningSettingsSnapshot()
        assert.deepEqual(snapshot.values, defaultPreferences)
        assert.equal(snapshot.ready, false)
        assert.equal(snapshot.saveError, false)
        assert.equal(snapshot.background.image, null)
        assert.equal(snapshot.background.ready, false)
        return createElement('output', null, snapshot.values.voice)
    }

    const html = renderToStaticMarkup(
        createElement(LearningSettingsProvider, null, [
            createElement(ReadSettings, { key: 'page' }),
            createElement(ReadSettings, { key: 'practice' }),
        ]),
    )
    assert.equal(html, '<output>美式男音</output><output>美式男音</output>')
})

test('消费者缺少唯一 Provider 时明确报错，不能静默创建第二份状态', (): void => {
    function ReadSettings(): ReactElement {
        useLearningSettingsSnapshot()
        return createElement('span')
    }

    assert.throws(
        (): string => renderToStaticMarkup(createElement(ReadSettings)),
        /LearningSettingsProvider/,
    )
})
