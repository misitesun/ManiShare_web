import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { storage } from '../../../shared/lib/storage'
import { createWordToolbarOptions } from './word-toolbar-options'
import { createSentenceToolbarOptions } from './sentence-toolbar-options'
import { createAudioToolbarOptions } from './audio-toolbar-options'
import { createAdditionalToolbarOptions } from './additional-toolbar-options'
import { usePracticeToolbarPreferences } from './usePracticeToolbarPreferences'

test('缓存Hook预渲染使用确定初值，挂载恢复前不读取或写入存储', (context): void => {
    const get = context.mock.method(storage, 'get', (): never => assert.fail('SSR不得读取缓存'))
    const set = context.mock.method(storage, 'set', (): never => assert.fail('SSR不得写入缓存'))
    function ReadPreferences(): ReactElement {
        const state = usePracticeToolbarPreferences()
        assert.equal(state.ready, false)
        assert.equal(state.saveError, false)
        assert.deepEqual(state.word('pronounce'), createWordToolbarOptions('pronounce'))
        assert.deepEqual(state.sentence('translate'), createSentenceToolbarOptions('translate'))
        assert.deepEqual(state.audio('blocks'), createAudioToolbarOptions('blocks'))
        assert.deepEqual(
            state.additional('guess', 'spell'),
            createAdditionalToolbarOptions('guess', 'spell'),
        )
        return createElement('output', null, state.ready ? '已恢复' : '等待挂载恢复')
    }
    const first = renderToStaticMarkup(createElement(ReadPreferences))
    assert.equal(first, '<output>等待挂载恢复</output>')
    assert.equal(renderToStaticMarkup(createElement(ReadPreferences)), first)
    assert.equal(get.mock.callCount(), 0)
    assert.equal(set.mock.callCount(), 0)
})
