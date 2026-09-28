import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CourseCollectionEditActions } from './CourseCollectionEditActions'

function renderActions(isEditing: boolean, selectedItemCount: number): string {
    return renderToStaticMarkup(
        createElement(CourseCollectionEditActions, {
            isEditing,
            selectedItemCount,
            onCancel: (): void => undefined,
            onDelete: (): void => undefined,
            onEdit: (): void => undefined,
        }),
    )
}

test('browsing hides cancel access and exposes enabled edit', () => {
    const html = renderActions(false, 0)
    assert.match(html, /inert=""/)
    assert.match(html, /aria-hidden="true"/)
    assert.match(html, />编辑<\/button>/)
    assert.doesNotMatch(html, /disabled=""/)
})

test('editing exposes cancel and enables deletion only with a selection', () => {
    const empty = renderActions(true, 0)
    assert.doesNotMatch(empty, /inert=""/)
    assert.match(empty, />删除<\/button>/)
    assert.match(empty, /disabled=""/)
    assert.doesNotMatch(renderActions(true, 1), /disabled=""/)
})
