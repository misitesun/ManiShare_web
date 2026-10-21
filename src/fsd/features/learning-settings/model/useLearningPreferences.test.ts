import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { notification } from '../../../shared/notification'
import { defaultPreferences } from './preferences'
import { restoreLearningPreferences, useLearningPreferences } from './useLearningPreferences'

test('历史完成音色仅迁移至落幕并回写一次，保留音量和其他设置', (context): void => {
    let cached: unknown = {
        version: 1,
        values: {
            completionTone: '章节完成音效1',
            completionVolume: 47,
            typingTone: '跳音',
            correctSound: false,
        },
    }
    context.mock.method(storage, 'get', (): unknown => cached)
    const write = context.mock.method(storage, 'set', (_key: string, value: unknown): void => {
        cached = value
    })
    const restored = restoreLearningPreferences()
    assert.equal(restored.values.completionTone, '落幕（默认）')
    assert.equal(restored.values.completionVolume, 47)
    assert.equal(restored.values.typingTone, '跳音')
    assert.equal(restored.values.correctSound, false)
    assert.equal(restored.saveError, false)
    assert.deepEqual(restoreLearningPreferences(), restored)
    assert.equal(write.mock.callCount(), 1)
})

test('SSR首帧使用确定Shift默认，不读写缓存或弹存储错误', (context): void => {
    const get = context.mock.method(storage, 'get', (): never => assert.fail('SSR不得读取缓存'))
    const set = context.mock.method(storage, 'set', (): never => assert.fail('SSR不得写入缓存'))
    const notify = context.mock.method(notification, 'error', (): never =>
        assert.fail('SSR不得显示通知'),
    )
    function ReadPreferences(): ReactElement {
        const state = useLearningPreferences()
        assert.deepEqual(state.values, defaultPreferences)
        assert.equal(state.ready, false)
        assert.equal(state.saveError, false)
        return createElement('output', null, state.values.playShortcut)
    }
    const first = renderToStaticMarkup(createElement(ReadPreferences))
    assert.equal(first, '<output>Shift + L</output>')
    assert.equal(renderToStaticMarkup(createElement(ReadPreferences)), first)
    assert.equal(get.mock.callCount(), 0)
    assert.equal(set.mock.callCount(), 0)
    assert.equal(notify.mock.callCount(), 0)
})

test('合法Ctrl缓存恢复为Shift后仅写回原v1键一次，再次恢复不重复写', (context): void => {
    let cached: unknown = {
        version: 1,
        values: {
            playShortcut: 'Ctrl + A',
            masteredShortcut: 'Ctrl + M',
            unfamiliarShortcut: 'Ctrl + Q',
            previousShortcut: 'Ctrl + ArrowLeft',
            nextShortcut: 'Ctrl + ArrowRight',
            speechRate: 1.4,
            showTranslation: false,
        },
    }
    const get = context.mock.method(storage, 'get', (): unknown => cached)
    const set = context.mock.method(storage, 'set', (_key: string, value: unknown): void => {
        cached = value
    })
    const restored = restoreLearningPreferences()
    assert.equal(restored.saveError, false)
    assert.equal(restored.values.playShortcut, 'Shift + A')
    assert.equal(restored.values.masteredShortcut, 'Shift + M')
    assert.equal(restored.values.unfamiliarShortcut, 'Shift + Q')
    assert.equal(restored.values.previousShortcut, 'Shift + ArrowLeft')
    assert.equal(restored.values.nextShortcut, 'Shift + ArrowRight')
    assert.equal(restored.values.speechRate, 1.4)
    assert.equal(restored.values.showTranslation, false)
    assert.deepEqual(set.mock.calls[0]?.arguments, [
        sharedConfig.storageKeys.learningPreferences,
        { version: 1, values: restored.values },
    ])
    assert.deepEqual(restoreLearningPreferences(), restored)
    assert.equal(get.mock.callCount(), 2)
    assert.equal(set.mock.callCount(), 1)
})

test('空缓存、坏字段及无Ctrl合法缓存不触发默认值回写', (context): void => {
    let cached: unknown
    context.mock.method(storage, 'get', (): unknown => cached)
    const set = context.mock.method(storage, 'set', (): never =>
        assert.fail('没有合法Ctrl旧字段不得自动写缓存'),
    )
    for (const value of [
        null,
        'bad JSON',
        { version: 2, values: { playShortcut: 'Ctrl + A' } },
        { version: 1, values: {} },
        { version: 1, values: { playShortcut: 'Ctrl + Ctrl + A' } },
        { version: 1, values: { playShortcut: 'Alt + Ctrl + A' } },
        {
            version: 1,
            values: {
                playShortcut: 'Shift + A',
                masteredShortcut: 'Alt + M',
                unfamiliarShortcut: 'Meta + Q',
                previousShortcut: 'F7',
                nextShortcut: 'F8',
            },
        },
    ]) {
        cached = value
        assert.equal(restoreLearningPreferences().saveError, false)
    }
    assert.equal(set.mock.callCount(), 0)
})

test('迁移写失败保留Shift内存选择与其他偏好并暴露保存失败', (context): void => {
    context.mock.method(storage, 'get', (): unknown => ({
        version: 1,
        values: {
            playShortcut: 'Ctrl + Alt + Shift + Meta + A',
            masteredShortcut: 'Ctrl + M',
            unfamiliarShortcut: 'Ctrl + Q',
            speechRate: 1.4,
        },
    }))
    const set = context.mock.method(storage, 'set', (): never => {
        throw new Error('quota unavailable')
    })
    const result = restoreLearningPreferences()
    assert.equal(result.saveError, true)
    assert.equal(result.values.playShortcut, 'Alt + Shift + Meta + A')
    assert.equal(result.values.masteredShortcut, 'Shift + M')
    assert.equal(result.values.unfamiliarShortcut, 'Shift + Q')
    assert.equal(result.values.speechRate, 1.4)
    assert.equal(set.mock.callCount(), 1)
})

test('数字标点迁移落盘使用基础键，历史Shift符号恢复不额外触发回写', (context): void => {
    let cached: unknown = {
        version: 1,
        values: { playShortcut: 'Ctrl + 1', masteredShortcut: 'Ctrl + ;' },
    }
    context.mock.method(storage, 'get', (): unknown => cached)
    const set = context.mock.method(storage, 'set', (_key: string, value: unknown): void => {
        cached = value
    })
    const migrated = restoreLearningPreferences()
    assert.equal(migrated.values.playShortcut, 'Shift + 1')
    assert.equal(migrated.values.masteredShortcut, 'Shift + ;')
    assert.deepEqual(set.mock.calls[0]?.arguments, [
        sharedConfig.storageKeys.learningPreferences,
        { version: 1, values: migrated.values },
    ])
    cached = {
        version: 1,
        values: { playShortcut: 'Shift + !', masteredShortcut: 'Shift + :' },
    }
    const aliases = restoreLearningPreferences()
    assert.equal(aliases.saveError, false)
    assert.equal(aliases.values.playShortcut, 'Shift + 1')
    assert.equal(aliases.values.masteredShortcut, 'Shift + ;')
    assert.equal(set.mock.callCount(), 1)
})

test('读取失败返回可继续使用的独立默认内存并标记错误，不尝试覆盖缓存', (context): void => {
    context.mock.method(storage, 'get', (): never => {
        throw new Error('storage blocked')
    })
    const set = context.mock.method(storage, 'set', (): never =>
        assert.fail('读取失败不得写入默认值'),
    )
    const result = restoreLearningPreferences()
    assert.equal(result.saveError, true)
    assert.deepEqual(result.values, defaultPreferences)
    assert.notEqual(result.values, defaultPreferences)
    assert.equal(set.mock.callCount(), 0)
})
