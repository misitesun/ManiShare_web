import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chatSettingsReducer, initialChatSettings } from './chat-settings'

test('对话设置使用设计稿默认值并独立更新每项选择', () => {
    assert.deepEqual(initialChatSettings, {
        blindListening: true,
        feedback: true,
        level: 'beginner',
        playbackRate: '0.8',
        translation: false,
    })

    const translated = chatSettingsReducer(initialChatSettings, {
        type: 'toggle-translation',
    })
    const faster = chatSettingsReducer(translated, {
        type: 'set-playback-rate',
        value: '1.2',
    })
    const advanced = chatSettingsReducer(faster, {
        type: 'set-level',
        value: 'advanced',
    })

    assert.equal(advanced.translation, true)
    assert.equal(advanced.playbackRate, '1.2')
    assert.equal(advanced.level, 'advanced')
    assert.equal(advanced.blindListening, true)
    assert.equal(advanced.feedback, true)
})
