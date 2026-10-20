import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import { PracticeNotesPanel } from './PracticeNotesPanel'

test('笔记侧栏预渲染不输出Portal、不读取时钟或触发编辑保存', (): void => {
    let actions = 0
    function action(): void {
        actions += 1
    }
    for (const open of [false, true]) {
        const html = renderToStaticMarkup(
            createElement(PracticeNotesPanel, {
                open,
                questions: getDemoQuestions('word', 'pronounce'),
                controller: {
                    notes: [],
                    editor: null,
                    canSave: false,
                    open: action,
                    edit: action,
                    save: action,
                    remove: action,
                    cancel: action,
                    close: action,
                },
                onClose: action,
            }),
        )
        assert.equal(html, '')
    }
    assert.equal(actions, 0)
})
