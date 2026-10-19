import assert from 'node:assert/strict'
import test from 'node:test'
import type { ShortcutPreferences } from '../../../features/learning-settings'
import { getPracticeCommandBindings } from './practice-bindings'

const defaults: ShortcutPreferences = Object.freeze({
    previousShortcut: 'Shift + ArrowLeft',
    nextShortcut: 'Shift + ArrowRight',
    playShortcut: 'Shift + L',
    masteredShortcut: 'Shift + J',
    unfamiliarShortcut: 'Shift + K',
})

test('固定流程绑定和可自定义绑定由同一入口分别提供', (): void => {
    for (const [command, bindings] of [
        ['practice.primary', ['Enter']],
        ['practice.contextual', ['Space']],
        ['practice.oral', ['V']],
        ['practice.dismiss', ['Escape']],
        ['practice.panel.show', ['ArrowDown']],
        ['practice.panel.hide', ['ArrowUp']],
        ['practice.panel.toggle', ['ArrowDown', 'ArrowUp']],
        ['session.replay', ['Space']],
        ['session.nextChapter', ['Enter']],
        ['session.return', ['Escape']],
        ['question.previous', ['Shift + ArrowLeft']],
        ['question.next', ['Shift + ArrowRight']],
        ['practice.readAloud', ['Shift + L']],
        ['practice.markMastered', ['Shift + J']],
        ['practice.markUnfamiliar', ['Shift + K']],
    ] as const)
        assert.deepEqual(getPracticeCommandBindings(command, defaults), bindings)
})

test('用户合法自定义覆盖切题和朗读默认值，不改写流程键', (): void => {
    const values: ShortcutPreferences = {
        ...defaults,
        previousShortcut: 'Alt + P',
        nextShortcut: 'Alt + N',
        playShortcut: 'F7',
    }
    assert.deepEqual(getPracticeCommandBindings('question.previous', values), ['Alt + P'])
    assert.deepEqual(getPracticeCommandBindings('question.next', values), ['Alt + N'])
    assert.deepEqual(getPracticeCommandBindings('practice.readAloud', values), ['F7'])
    assert.deepEqual(getPracticeCommandBindings('practice.primary', values), ['Enter'])
    assert.deepEqual(getPracticeCommandBindings('practice.contextual', values), ['Space'])
})

test('冲突双方不提供可执行提示，其他绑定和固定流程继续可用', (): void => {
    const values: ShortcutPreferences = {
        ...defaults,
        playShortcut: defaults.previousShortcut,
    }
    assert.deepEqual(getPracticeCommandBindings('question.previous', values), [])
    assert.deepEqual(getPracticeCommandBindings('practice.readAloud', values), [])
    assert.deepEqual(getPracticeCommandBindings('question.next', values), ['Shift + ArrowRight'])
    assert.deepEqual(getPracticeCommandBindings('practice.primary', values), ['Enter'])
})

test('旧偏好中的无效值及保留流程键不成为切题绑定', (): void => {
    for (const previousShortcut of [
        'bad shortcut',
        'Enter',
        'Space',
        'V',
        'ArrowDown',
        'Ctrl + P',
    ]) {
        const values = { ...defaults, previousShortcut }
        assert.deepEqual(getPracticeCommandBindings('question.previous', values), [])
        assert.equal(values.previousShortcut, previousShortcut)
    }
})
